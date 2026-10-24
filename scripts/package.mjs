import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const name = pkg.name.split('/').pop();
const paths = [
  'src',
  'docs',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
];
if (name.includes('widget')) paths.push('config.example.js');
const files = [];
function collect(path) {
  if (path.endsWith('.local.js'))
    throw new Error('Local configuration cannot be packaged');
  try {
    for (const child of readdirSync(path, { withFileTypes: true }))
      collect(join(path, child.name));
  } catch (error) {
    if (error.code !== 'ENOTDIR') throw error;
    files.push(path);
  }
}
paths.forEach(collect);
files.sort();
function crc32(data) {
  let crc = 0xffffffff;
  for (const value of data) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const local = [],
  central = [];
let offset = 0;
for (const file of files) {
  const data = readFileSync(file);
  const path = Buffer.from(
    `${name}/${relative('.', file).replaceAll('\\', '/')}`,
  );
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6);
  header.writeUInt16LE(33, 12);
  header.writeUInt32LE(crc32(data), 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(path.length, 26);
  local.push(header, path, data);
  const index = Buffer.alloc(46);
  index.writeUInt32LE(0x02014b50);
  index.writeUInt16LE(20, 4);
  index.writeUInt16LE(20, 6);
  header.copy(index, 8, 6, 28);
  index.writeUInt32LE(offset, 42);
  central.push(index, path);
  offset += header.length + path.length + data.length;
}
const directory = Buffer.concat(central),
  end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
mkdirSync('dist', { recursive: true });
const output = `dist/${name}-v${pkg.version}.zip`;
writeFileSync(output, Buffer.concat([...local, directory, end]));
console.log(output);
