easy-nodefy [![Build Status](https://travis-ci.org/easy-js/easy-nodefy.svg)](https://travis-ci.org/easy-js/easy-nodefy)
-----------

Convert AMD modules into commonjs format. Used in [easy-build](https://github.com/easy-js/easy-build) to create commonjs distributions.

**This tool aims to convert basic modules**, plugins and advanced settings
probably are NOT going to be supported in the near future (I have plans to
support basic configs. Check the [uRequire](https://github.com/anodynos/uRequire) project in case you need something more complex.

**Originally adapted from** [millermedeiros/nodefy](https://github.com/millermedeiros/nodefy)
#### Example Usage

```
var convertBatch = require('easy-nodefy).convertBatch;
...
convertBatch('glob/of/files', {
  outputPath: 'out/path'
}, onConvertComplete);
```


## API

#### nodefy.parse(raw, options)

Parse string with given options and return the converted commonjs result.

* **\*raw**: String -- Raw string contents to convert.
* **options**: Object -- Parsing options.
  * **map**: Object -- Map where the key represents the current dependency id and the value represents the id to use as a replcacement during conversion.. 

#### nodefy.convertFile(inputPath, options, callback)

Convert a single file.

* **\*inputPath**: String -- Path of file to convert.
* **options**: Object -- [Parsing options](#nodefy.parseraw-options).
  
#### nodefy.convertBatch(inputPath, options, callback)

Convert a batch of files.

* **\*inputPath**: String -- Path of directory to convert.
* **options**: Object -- [Parsing options](#nodefy.parseraw-options).


## TESTS

**Install Dependencies**

```
npm install
```

**Run/View**

```
npm test
```


## License

The MIT License (MIT) Copyright (c) 2014 First Opinion

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.