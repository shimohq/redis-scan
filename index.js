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
   * @param {function} [options.handler=console.log] promisify handler function
   * @param {boolean} [options.aliyun=false]
   */
  constructor (options = {}) {
    Object.assign(this, Object.assign({}, {
      size: 100,
      pattern: '*',
      handler: console.log
    }, options))

    // Avoid throw error if local redis not exists
    if (!this.redis) {
      this.redis = new Ioredis()
    }
  }

  async start () {
    const clusterCount = await this.getClusterCount()

    this.scannedCount = 0
    this.startTime = Date.now()

    let clusterIndex = 0

    while (clusterIndex < clusterCount && !this.stopped) {
      await this.scanCluster(clusterIndex)
      clusterIndex++
    }

    console.log(`scan result:
  cluster count: ${clusterCount}
  pattern: ${this.pattern}
  scanned count: ${this.scannedCount}
  expire: ${pretty(Date.now() - this.startTime)}
    `)
  }

  async scanCluster (clusterIndex) {
    const { handler } = this
    let cursor = 0

    do {
      const [tmpCursor, arr] = await this.scan({ cursor, clusterIndex })

      cursor = Number(tmpCursor)

      for (let i = 0; i < arr.length; i++) {
        this.scannedCount++
        await handler({
          key: arr[i],
          index: this.scannedCount,
          clusterIndex,
          stop: () => { this.stop = true }
        })
      }
    } while (cursor !== 0 && !this.stop)
  }

  // return 1 if cluster is not ailyun redis instance
  async getClusterCount () {
    if (!this.aliyun) {
      return 1
    }
    const info = await this.redis.info()
    const clusterModePrefix = 'nodecount:'
    if (info.indexOf(clusterModePrefix) > -1) {
      const line = info.split('\n').find(item => item.indexOf(clusterModePrefix) > -1)
      if (line) {
        return Number(line.replace(clusterModePrefix, ''))
      }
    }
    return 1
  }

  scan (options) {
    const params = [options.cursor, 'match', this.pattern, 'count', this.size]
    let command = 'scan'
    if (this.aliyun) {
      params.unshift(options.clusterIndex)
      command = 'iscan'
    }

    return this.redis.call(command, params)
  }
}

module.exports = RedisScan
