const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const projectRoot = path.join(__dirname, '../..');
const inputPath = path.join(projectRoot, 'docs/api/openapi_spec.yaml');
const outputPath = path.join(projectRoot, 'docs/api/openapi_spec.json');

const spec = yaml.load(fs.readFileSync(inputPath, 'utf8'));

fs.writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
