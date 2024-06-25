const SourceMap = require('source-map');
const fs = require('fs');
const path = require('path')

const SourceMapConsumer = SourceMap.SourceMapConsumer;

async function parse(sourceMapFilePath, line, column, stack) {
  if (!sourceMapFilePath) return;

  if (stack) {
    console.log(stack);
  }

  const sourceMapConsumer = await new SourceMapConsumer(JSON.parse(fs.readFileSync(sourceMapFilePath, 'utf8')));
  const res= sourceMapConsumer.originalPositionFor({
    line,
    column,
  });
  return res;
}

const line = 1;
const column = 78
const map = path.resolve(process.cwd(), './common2-compiled-min-modified.js.map')

parse(map, line, column).then((data) => {
  console.log(data);
}).catch((err) => {
  console.log(err);
});
