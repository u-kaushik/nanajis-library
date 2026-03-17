"""
Convert all .WRI, .DOC, .DOCX files in original/ to PDF in converted/
Uses Microsoft Word COM automation via pywin32.
Restarts Word automatically if it crashes (RPC error).
Unblocks .WRI files via registry before starting.
"""
import os
import sys
import time
import subprocess
import winreg
import win32com.client
import pythoncom

BASE = os.path.dirname(os.path.abspath(__file__))
ORIGINAL = os.path.join(BASE, "original")
CONVERTED = os.path.join(BASE, "converted")

# Word constants
wdFormatPDF = 17

EXTENSIONS = {'.wri', '.doc', '.docx', '.wuw', '.rtf', '.txt'}


def unblock_wri_in_trust_center():
    """Unblock .WRI (Windows Write) files in Word's Trust Center via registry."""
    # Word 16.0 File Block settings - set .wri to 0 (not blocked)
    key_path = r"SOFTWARE\Microsoft\Office\16.0\Word\Security\FileBlock"
    try:
        key = winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        # FilesBeforeVersion = type 2 files (old binary), set to 0 to unblock
        winreg.SetValueEx(key, "FilesBeforeVersion", 0, winreg.REG_DWORD, 0)
        # Also unblock Write files specifically
        winreg.SetValueEx(key, "WordWrite", 0, winreg.REG_DWORD, 0)
        # Unblock Word 2 files
        winreg.SetValueEx(key, "Word2Files", 0, winreg.REG_DWORD, 0)
        # Unblock Word 6.0 binary
        winreg.SetValueEx(key, "Word60Files", 0, winreg.REG_DWORD, 0)
        # Unblock Word 95 binary
        winreg.SetValueEx(key, "Word95Files", 0, winreg.REG_DWORD, 0)
        winreg.CloseKey(key)
        print("Trust Center: Unblocked old file formats (.WRI, Word 2/6/95)")
    except Exception as e:
        print(f"Warning: Could not modify Trust Center settings: {e}")
        print("  .WRI files may fail to open. Manually unblock in Word > Options > Trust Center.")


def kill_word():
    """Force-kill any running Word processes."""
    try:
        subprocess.run(["taskkill", "/f", "/im", "WINWORD.EXE"],
                       capture_output=True, timeout=10)
    except:
        pass
    time.sleep(2)


def start_word():
    """Start a fresh Word COM instance."""
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = False
    return word


def convert_single(word, src_path, pdf_path):
    """Convert a single file. Returns (success, word_instance).
    If Word crashes, returns (False, None) so caller knows to restart."""
    doc = None
    try:
        doc = word.Documents.Open(
            os.path.abspath(src_path),
            ReadOnly=True,
            AddToRecentFiles=False,
            Visible=False,
            ConfirmConversions=False
        )
        doc.SaveAs2(os.path.abspath(pdf_path), FileFormat=wdFormatPDF)
        doc.Close(SaveChanges=False)
        return True, word
    except Exception as e:
        err_str = str(e)
        # RPC unavailable = Word crashed
        if "2147023174" in err_str or "RPC" in err_str:
            print(f"FAILED (Word crashed)")
            return False, None  # Signal to restart Word
        else:
            print(f"FAILED: {e}")
            try:
                if doc:
                    doc.Close(SaveChanges=False)
            except:
                pass
            return False, word


def collect_all_files(src_root, dst_root):
    """Collect all files that need conversion."""
    files = []
    for dirpath, dirnames, filenames in os.walk(src_root):
        doc_files = [f for f in filenames if os.path.splitext(f)[1].lower() in EXTENSIONS]
        if not doc_files:
            continue
        rel = os.path.relpath(dirpath, src_root)
        out_dir = os.path.join(dst_root, rel)
        for fname in doc_files:
            src_path = os.path.join(dirpath, fname)
            base_name = os.path.splitext(fname)[0]
            pdf_path = os.path.join(out_dir, base_name + ".pdf")
            files.append((src_path, pdf_path, out_dir))
    return files


def main():
    pythoncom.CoInitialize()

    # Step 1: Unblock old file formats
    unblock_wri_in_trust_center()

    # Step 2: Collect all files across all folders
    all_files = []
    for folder in sorted(os.listdir(ORIGINAL)):
        src = os.path.join(ORIGINAL, folder)
        if not os.path.isdir(src):
            continue
        dst = os.path.join(CONVERTED, folder)
        files = collect_all_files(src, dst)
        all_files.extend(files)

    # Filter to only files not yet converted
    todo = [(s, p, d) for s, p, d in all_files if not os.path.exists(p)]
    already_done = len(all_files) - len(todo)

    print(f"\nTotal documents found: {len(all_files)}")
    print(f"Already converted: {already_done}")
    print(f"Remaining to convert: {len(todo)}")

    if not todo:
        print("Nothing to do!")
        pythoncom.CoUninitialize()
        return

    # Step 3: Start Word and convert
    print("\nStarting Word...")
    kill_word()
    word = start_word()

    converted = 0
    failed = 0
    failed_files = []
    restart_count = 0
    BATCH_SIZE = 50  # Restart Word every N files to prevent crashes

    for i, (src_path, pdf_path, out_dir) in enumerate(todo):
        os.makedirs(out_dir, exist_ok=True)

        # Restart Word periodically to prevent memory issues
        if i > 0 and i % BATCH_SIZE == 0:
            print(f"\n  [Restarting Word after {BATCH_SIZE} files to prevent crashes...]")
            try:
                word.Quit()
            except:
                pass
            time.sleep(2)
            kill_word()
            word = start_word()
            restart_count += 1

        rel_path = os.path.relpath(src_path, ORIGINAL)
        print(f"  [{i+1}/{len(todo)}] {rel_path}", end=" ... ", flush=True)

        success, word = convert_single(word, src_path, pdf_path)

        if success:
            converted += 1
            print("OK")
        else:
            if word is None:
                # Word crashed - restart it
                failed += 1
                failed_files.append(src_path)
                print("  [Restarting Word...]")
                kill_word()
                word = start_word()
                restart_count += 1
                # Retry the same file once
                print(f"  [{i+1}/{len(todo)}] RETRY {rel_path}", end=" ... ", flush=True)
                success2, word = convert_single(word, src_path, pdf_path)
                if success2:
                    converted += 1
                    failed -= 1
                    failed_files.pop()
                    print("OK (on retry)")
                elif word is None:
                    print("FAILED again, restarting Word...")
                    kill_word()
                    word = start_word()
                    restart_count += 1
            else:
                failed += 1
                failed_files.append(src_path)

    # Cleanup
    print("\nClosing Word...")
    try:
        word.Quit()
    except:
        pass
    pythoncom.CoUninitialize()

    print(f"\n{'='*60}")
    print(f"RESULTS:")
    print(f"  Converted:     {converted}")
    print(f"  Already done:  {already_done}")
    print(f"  Failed:        {failed}")
    print(f"  Word restarts: {restart_count}")
    if failed_files:
        print(f"\nFailed files ({len(failed_files)}):")
        for p in failed_files:
            print(f"  {os.path.relpath(p, ORIGINAL)}")


if __name__ == "__main__":
    main()
