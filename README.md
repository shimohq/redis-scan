# redis-scan
Scan redis keys with pattern and do something to them

## install
```
npm i shimo-redis-scan
```

## usage

```javascript
const RedisScan = require('shimo-redis-scan')
const Ioredis = require('ioredis')

const scan = new RedisScan({
  // pattern
  pattern: 'key:*',
  // redis client
  redis: new Ioredis(),
  // scan count per time
  size: 1000,
  // handler function which return promise
  handler: function (key, { index, stop }) {
    console.log('current index:', index)
    if (index > 10000) {
      stop()
    }
  }
})
```

## License
MIT
