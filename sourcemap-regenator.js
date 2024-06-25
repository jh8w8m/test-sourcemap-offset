const { SourceMapConsumer, SourceMapGenerator } = require('source-map');
const fs = require('fs');
const path = require('path')

async function reGenerate() {
  const rawSourceMap = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './common1-compiled-min.js.map'), 'utf8')); // 可替换

  const consumer = await new SourceMapConsumer(rawSourceMap);
  let sourcesContent = consumer.sourcesContent;

  // 从 consumer 中生成新的 sourcemap
  const generator = new SourceMapGenerator({
    "file": consumer.file,
    "sourceRoot": consumer.sourceRoot,
  });
  let mappings = [];
  consumer.eachMapping(function (mapping) {
    mappings.push(mapping);
  });

  // 遍历现有的source map中的所有映射，缓存每个代码段
  const codeSegmentList = [];
  for(let i = 0; i < mappings.length; i++) {
    const cur = mappings[i];
    const next = (i===mappings.length-1) ? null : mappings[i+1];
    const sourceFile = cur.source;

    // 准备整个源代码内容，以换行符分割
    const content = consumer.sourceContentFor(sourceFile);
    const lines = content.split('\n');
    const lineContent = lines[cur.originalLine - 1];

    // 在当前行中使用 next 截取计算当前映射的代码片段，next 不存在则默认全长
    const codeSegment = lineContent.slice(cur.originalColumn, next ? next.originalColumn : lineContent.length);
    codeSegmentList.push(codeSegment);
    // console.log('Code Segment:', codeSegment);
  }

  // 遍历所有代码段，查询符合的 pattern，然后累加偏移量
  // 还需要在每次遍历中执行 addMapping
  let replacementOffset = 0;
  for (let j = 0; j < codeSegmentList.length; j++) {
    const regex = new RegExp(`"(@/common[^"]*)"`, 'g');
    if (regex.test(codeSegment)) {
      // 如果当前映射的代码片段中包含关键字，稳妥一点，查询前两个 mapping 是否是 require 和 '('
      // 如果是 require( + 模块关键字 的形式，则判定为需要替换的代码片段
      let judgeExternalAlias = false;
      try {
        const prevM1 = codeSegmentList[j-1];
        const prevM2 = codeSegmentList[j-2];
        if (prevM1 === 'require' && prevM2 === '(') {
          judgeExternalAlias = true;
        }
      } catch (err) {}
      if (judgeExternalAlias) {
        // 这里简化了一下，每次加固定的偏移量
        replacementOffset +=
      }
    }
  }
  // consumer.eachMapping(function (mapping) {
  //   const replacementOffset = 0;
  //   // 生成新的映射
  //   console.log("mapping", mapping)
  //   const sourceFile = mapping.source;
  //   const content = consumer.sourceContentFor(sourceFile);
  //   const lines = content.split('\n');
  //   const lineContent = lines[mapping.originalLine - 1];
  //   const codeSegment = lineContent.slice(mapping.originalColumn);
  //   console.log('Code Segment:', codeSegment);
  //   generator.addMapping({
  //     generated: {
  //       line: mapping.generatedLine,
  //       column: mapping.generatedColumn
  //     },
  //     source: mapping.source,
  //     original: {
  //       line: mapping.originalLine,
  //       column: mapping.originalColumn
  //     },
  //     name: mapping.name
  //   });
  // });

  // 设置新的sourcesContent
  consumer.sources.forEach(function (sourceFile) {
    const content = consumer.sourceContentFor(sourceFile);
    if (content != null) {
      // 根据关键字匹配，替换 sourcesContent 中每个文件中的所有内容，获取新的 sourcesContent 备用
      const regex = new RegExp(`require\\("(@/common[^"]*)"\\)`, 'g');
      const newContent = content.replace(regex, (match, p1) => {
        // @/common/res => ../../../../common/res
        const replacement = '../../../../common/' + p1.replace('@/common/', '');
        return `require("${replacement}")`;
      });
      generator.setSourceContent(sourceFile, newContent);
    }
  });
  // generator.setSourceContent('new.min.js', newSourcesContent[0]);
  fs.writeFileSync(path.resolve(process.cwd(), './common2-compiled-min-modified.js.map'), generator.toString(), 'utf8');
}

reGenerate();
