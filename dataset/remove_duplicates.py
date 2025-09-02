import json
import hashlib
import os

def remove_duplicates(input_file, output_file):
    seen = set()
    with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', encoding='utf-8') as outfile:
        for line in infile:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                # Sort keys to ensure consistent hashing
                sorted_json = json.dumps(data, sort_keys=True)
                hash_obj = hashlib.md5(sorted_json.encode('utf-8'))
                hash_str = hash_obj.hexdigest()
                if hash_str not in seen:
                    seen.add(hash_str)
                    outfile.write(line + '\n')
            except json.JSONDecodeError:
                # If invalid JSON, skip or handle
                pass

if __name__ == "__main__":
    input_file = 'dataset.jsonl'
    output_file = 'dataset_cleaned.jsonl'
    remove_duplicates(input_file, output_file)
    # Replace original file
    os.replace(output_file, input_file)
    print("Duplicates removed.")