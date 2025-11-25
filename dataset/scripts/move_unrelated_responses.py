#!/usr/bin/env python3
"""
Move lines whose `completion` equals a given message to the end of a JSONL file.

Default input: `/home/saad/Desktop/Github/Side/dataset/dataset.jsonl`
Default output: `dataset_sorted.jsonl` in same directory unless `--inplace` used.

Usage examples:
  python3 scripts/move_unrelated_responses.py
  python3 scripts/move_unrelated_responses.py --input /path/to/dataset.jsonl --output /path/to/out.jsonl
  python3 scripts/move_unrelated_responses.py --inplace  # overwrites input (creates .bak)

The script preserves original order for both kept and moved items.
"""

import argparse
import json
import shutil
from pathlib import Path
import sys

DEFAULT_INPUT = Path('/home/saad/Desktop/Github/Side/dataset/dataset.jsonl')
MATCH_TEXT = "Sorry, I can only answer questions related to SQL and NoSQL databases."


def process_file(input_path: Path, output_path: Path, match_text: str):
    non_matches = []
    matches = []
    total = 0

    with input_path.open('r', encoding='utf-8') as f:
        for line_no, line in enumerate(f, start=1):
            line = line.rstrip('\n')
            if not line.strip():
                continue
            try:
                obj = json.loads(line)
            except Exception as e:
                print(f"Warning: skipping invalid JSON at line {line_no}: {e}", file=sys.stderr)
                continue

            total += 1
            completion = obj.get('completion') if isinstance(obj, dict) else None
            if isinstance(completion, str) and completion.strip() == match_text:
                matches.append(obj)
            else:
                non_matches.append(obj)

    # Write output: non-matching rows first, then matching rows
    with output_path.open('w', encoding='utf-8') as out:
        for obj in non_matches:
            out.write(json.dumps(obj, ensure_ascii=False) + '\n')
        for obj in matches:
            out.write(json.dumps(obj, ensure_ascii=False) + '\n')

    return total, len(non_matches), len(matches)


def main():
    parser = argparse.ArgumentParser(description='Move JSONL rows with a specific completion to the end of file.')
    parser.add_argument('--input', '-i', type=Path, default=DEFAULT_INPUT, help='Input JSONL file path')
    parser.add_argument('--output', '-o', type=Path, help='Output JSONL file path (default: input.parent/dataset_sorted.jsonl)')
    parser.add_argument('--inplace', action='store_true', help='Overwrite the input file (backup created as input.bak)')
    parser.add_argument('--match', type=str, default=MATCH_TEXT, help='Exact completion text to match')

    args = parser.parse_args()

    input_path = args.input
    if not input_path.exists():
        print(f"Input file does not exist: {input_path}", file=sys.stderr)
        sys.exit(2)

    if args.inplace:
        backup_path = input_path.with_suffix(input_path.suffix + '.bak')
        shutil.copy2(input_path, backup_path)
        print(f"Backup created at: {backup_path}")
        # write to temporary file and replace
        temp_out = input_path.with_suffix(input_path.suffix + '.tmp')
        out_path = temp_out
    else:
        out_path = args.output or (input_path.parent / 'dataset_sorted.jsonl')

    total, kept, moved = process_file(input_path, out_path, args.match)

    print(f"Processed {total} JSONL records. Kept: {kept}. Moved: {moved}.")

    if args.inplace:
        # replace original with temp
        shutil.move(str(out_path), str(input_path))
        print(f"Replaced original file with updated file: {input_path}")


if __name__ == '__main__':
    main()



    # cp /home/saad/Desktop/Github/Side/dataset/dataset.jsonl /home/saad/Desktop/Github/Side/dataset/dataset.jsonl.bak && mv /home/saad/Desktop/Github/Side/dataset/dataset_sorted.jsonl /home/saad/Desktop/Github/Side/dataset/dataset.jsonl && echo '---last 10 lines of updated dataset.jsonl---' && tail -n 10 /home/saad/Desktop/Github/Side/dataset/dataset.jsonl
