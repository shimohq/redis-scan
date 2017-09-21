const Ioredis = require('ioredis')
const pretty = require('pretty-ms')

class RedisScan {
  /**
   * Creates an instance of RedisScan.
   *
   * @param {object} [options]
   * @param {ioreids} [options.redis=new ioredis()] ioredis client
   * @param {pattern} [options.pattern='*'] redis pattern key like "key:*"
   * @param {number} [options.size=100] key count each scan
   * @param {function} [options.handler=console.log] handler function
   */
  constructor (options = {}) {
    Object.assign(this, Object.assign({}, {
      size: 100,
      pattern: '*',
      handler: console.log,
      redis: new Ioredis()
    }, options))
  }

  async start () {
    const { redis, pattern, handler, size } = this
    let startTime = Date.now()
    let count = 0
    let cursor = 0
    let stop = false

    do {
      const tempArr = await redis.scan(cursor, 'match', pattern, 'count', size)

      cursor = +tempArr[0]

      const arr = tempArr[1]

      for (let i = 0; i < arr.length; i++) {
        try {
          count++
          await handler(arr[i], {
            index: cursor + i,
            stop: () => { stop = true }
          })
        } catch (e) {
          console.warn(e.message, e.stack)
        }
      }
    } while (cursor !== 0 && stop === false)

    const endTime = Date.now()
    console.log(`scan pattern "${pattern}" done, count: ${count}, expire: ${pretty(endTime - startTime)}`)
  }
}

module.exports = RedisScan
