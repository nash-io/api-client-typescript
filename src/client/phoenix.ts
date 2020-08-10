/* tslint:disable */

/**
 * Ported to typescript
 *
 * Everything not needed removed
 */

/**
 * Phoenix Channels JavaScript client
 *
 * ## Socket Connection
 *
 * A single connection is established to the server and
 * channels are multiplexed over the connection.
 * Connect to the server using the `Socket` class:
 *
 * ```javascript
 * let socket = new Socket("/socket", {params: {userToken: "123"}})
 * socket.connect()
 * ```
 *
 * The `Socket` constructor takes the mount point of the socket,
 * the authentication params, as well as options that can be found in
 * the Socket docs, such as configuring the `LongPoll` transport, and
 * heartbeat.
 *
 * ## Channels
 *
 * Channels are isolated, concurrent processes on the server that
 * subscribe to topics and broker events between the client and server.
 * To join a channel, you must provide the topic, and channel params for
 * authorization. Here's an example chat room example where `"new_msg"`
 * events are listened for, messages are pushed to the server, and
 * the channel is joined with ok/error/timeout matches:
 *
 * ```javascript
 * let channel = socket.channel("room:123", {token: roomToken})
 * channel.on("new_msg", msg => console.log("Got message", msg) )
 * $input.onEnter( e => {
 *   channel.push("new_msg", {body: e.target.val}, 10000)
 *     .receive("ok", (msg) => console.log("created message", msg) )
 *     .receive("error", (reasons) => console.log("create failed", reasons) )
 *     .receive("timeout", () => console.log("Networking issue...") )
 * })
 *
 * channel.join()
 *   .receive("ok", ({messages}) => console.log("catching up", messages) )
 *   .receive("error", ({reason}) => console.log("failed join", reason) )
 *   .receive("timeout", () => console.log("Networking issue. Still waiting..."))
 *```
 *
 * ## Joining
 *
 * Creating a channel with `socket.channel(topic, params)`, binds the params to
 * `channel.params`, which are sent up on `channel.join()`.
 * Subsequent rejoins will send up the modified params for
 * updating authorization params, or passing up last_message_id information.
 * Successful joins receive an "ok" status, while unsuccessful joins
 * receive "error".
 *
 * ## Duplicate Join Subscriptions
 *
 * While the client may join any number of topics on any number of channels,
 * the client may only hold a single subscription for each unique topic at any
 * given time. When attempting to create a duplicate subscription,
 * the server will close the existing channel, log a warning, and
 * spawn a new channel for the topic. The client will have their
 * `channel.onClose` callbacks fired for the existing channel, and the new
 * channel join will have its receive hooks processed as normal.
 *
 * ## Pushing Messages
 *
 * From the previous example, we can see that pushing messages to the server
 * can be done with `channel.push(eventName, payload)` and we can optionally
 * receive responses from the push. Additionally, we can use
 * `receive("timeout", callback)` to abort waiting for our other `receive` hooks
 *  and take action after some period of waiting. The default timeout is 10000ms.
 *
 *
 * ## Socket Hooks
 *
 * Lifecycle events of the multiplexed connection can be hooked into via
 * `socket.onError()` and `socket.onClose()` events, ie:
 *
 * ```javascript
 * socket.onError( () => console.log("there was an error with the connection!") )
 * socket.onClose( () => console.log("the connection dropped") )
 * ```
 *
 *
 * ## Channel Hooks
 *
 * For each joined channel, you can bind to `onError` and `onClose` events
 * to monitor the channel lifecycle, ie:
 *
 * ```javascript
 * channel.onError( () => console.log("there was an error!") )
 * channel.onClose( () => console.log("the channel has gone away gracefully") )
 * ```
 *
 * ### onError hooks
 *
 * `onError` hooks are invoked if the socket connection drops, or the channel
 * crashes on the server. In either case, a channel rejoin is attempted
 * automatically in an exponential backoff manner.
 *
 * ### onClose hooks
 *
 * `onClose` hooks are invoked only in two cases. 1) the channel explicitly
 * closed on the server, or 2). The client explicitly closed, by calling
 * `channel.leave()`
 *
 *
 * ## Presence
 *
 * The `Presence` object provides features for syncing presence information
 * from the server with the client and handling presences joining and leaving.
 *
 * ### Syncing state from the server
 *
 * To sync presence state from the server, first instantiate an object and
 * pass your channel in to track lifecycle events:
 *
 * ```javascript
 * let channel = socket.channel("some:topic")
 * let presence = new Presence(channel)
 * ```
 *
 * Next, use the `presence.onSync` callback to react to state changes
 * from the server. For example, to render the list of users every time
 * the list changes, you could write:
 *
 * ```javascript
 * presence.onSync(() => {
 *   myRenderUsersFunction(presence.list())
 * })
 * ```
 *
 * ### Listing Presences
 *
 * `presence.list` is used to return a list of presence information
 * based on the local state of metadata. By default, all presence
 * metadata is returned, but a `listBy` function can be supplied to
 * allow the client to select which metadata to use for a given presence.
 * For example, you may have a user online from different devices with
 * a metadata status of "online", but they have set themselves to "away"
 * on another device. In this case, the app may choose to use the "away"
 * status for what appears on the UI. The example below defines a `listBy`
 * function which prioritizes the first metadata which was registered for
 * each user. This could be the first tab they opened, or the first device
 * they came online from:
 *
 * ```javascript
 * let listBy = (id, {metas: [first, ...rest]}) => {
 *   first.count = rest.length + 1 // count of this user's presences
 *   first.id = id
 *   return first
 * }
 * let onlineUsers = presence.list(listBy)
 * ```
 *
 * ### Handling individual presence join and leave events
 *
 * The `presence.onJoin` and `presence.onLeave` callbacks can be used to
 * react to individual presences joining and leaving the app. For example:
 *
 * ```javascript
 * let presence = new Presence(channel)
 *
 * // detect if user has joined for the 1st time or from another tab/device
 * presence.onJoin((id, current, newPres) => {
 *   if(!current){
 *     console.log("user has entered for the first time", newPres)
 *   } else {
 *     console.log("user additional presence", newPres)
 *   }
 * })
 *
 * // detect if user has left from all tabs/devices, or is still present
 * presence.onLeave((id, current, leftPres) => {
 *   if(current.metas.length === 0){
 *     console.log("user has left from all devices", leftPres)
 *   } else {
 *     console.log("user left from a device", leftPres)
 *   }
 * })
 * // receive presence data from server
 * presence.onSync(() => {
 *   displayUsers(presence.list())
 * })
 * ```
 * @module phoenix
 */
import queryString from 'querystring'
const WebSocket = require('websocket').w3cwebsocket
const DEFAULT_VSN = '2.0.0'
enum SOCKET_STATES {
  connecting = 0,
  open = 1,
  closing = 2,
  closed = 3
}
const DEFAULT_TIMEOUT = 10000
const WS_CLOSE_NORMAL = 1000
type BindingCB = (resp: any, ref?: string, bindingRef?: string) => void
interface Binding {
  event: string
  ref: string
  callback: BindingCB
}
type HookCB = (resp: any) => void
interface Hook {
  status: string
  callback: HookCB
}
enum CHANNEL_STATES {
  closed = 'closed',
  errored = 'errored',
  joined = 'joined',
  joining = 'joining',
  leaving = 'leaving'
}
enum CHANNEL_EVENTS {
  close = 'phx_close',
  error = 'phx_error',
  join = 'phx_join',
  reply = 'phx_reply',
  leave = 'phx_leave'
}
const CHANNEL_LIFECYCLE_EVENTS = [
  CHANNEL_EVENTS.close,
  CHANNEL_EVENTS.error,
  CHANNEL_EVENTS.join,
  CHANNEL_EVENTS.reply,
  CHANNEL_EVENTS.leave
]
const TRANSPORTS = {
  longpoll: 'longpoll',
  websocket: 'websocket'
}

// wraps value in closure or returns closure
let closure = value => {
  if (typeof value === 'function') {
    return value
  } else {
    let closure = function() {
      return value
    }
    return closure
  }
}

/**
 * Initializes the Push
 * @param {Channel} channel - The Channel
 * @param {string} event - The event, for example `"phx_join"`
 * @param {Object} payload - The payload, for example `{user_id: 123}`
 * @param {number} timeout - The push timeout in milliseconds
 */
class Push {
  public channel: Channel
  public event: string
  public payload: any
  public receivedResp: any
  public timeoutTimer: NodeJS.Timeout | null
  public sent: boolean
  public recHooks: Array<Hook>
  public timeout: number

  public ref: string
  public refEvent: string

  constructor(channel: Channel, event: string, payload: any, timeout: number) {
    this.channel = channel
    this.event = event
    this.payload =
      payload ||
      function() {
        return {}
      }
    this.receivedResp = null
    this.timeout = timeout
    this.timeoutTimer = null
    this.recHooks = []
    this.sent = false
  }

  /**
   *
   * @param {number} timeout
   */
  resend(timeout: number) {
    this.timeout = timeout
    this.reset()
    this.send()
  }

  /**
   *
   */
  send() {
    if (this.hasReceived('timeout')) {
      return
    }
    this.startTimeout()
    this.sent = true
    this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload(),
      ref: this.ref,
      join_ref: this.channel.joinRef()
    })
  }

  /**
   *
   * @param {*} status
   * @param {*} callback
   */
  receive(status: string, callback: HookCB) {
    if (this.hasReceived(status)) {
      callback(this.receivedResp.response)
    }

    this.recHooks.push({ status, callback })
    return this
  }

  /**
   * @private
   */
  reset() {
    this.cancelRefEvent()
    this.ref = null
    this.refEvent = null
    this.receivedResp = null
    this.sent = false
  }

  /**
   * @private
   */
  matchReceive({ status, response }: { status: string; response: any }) {
    this.recHooks
      .filter(h => h.status === status)
      .forEach(h => h.callback(response))
  }

  /**
   * @private
   */
  cancelRefEvent() {
    if (!this.refEvent) {
      return
    }
    this.channel.off(this.refEvent)
  }

  /**
   * @private
   */
  cancelTimeout() {
    clearTimeout(this.timeoutTimer)
    this.timeoutTimer = null
  }

  /**
   * @private
   */
  startTimeout() {
    if (this.timeoutTimer) {
      this.cancelTimeout()
    }
    this.ref = this.channel.socket.makeRef()
    this.refEvent = this.channel.replyEventName(this.ref)

    this.channel.on(this.refEvent, (payload: any) => {
      this.cancelRefEvent()
      this.cancelTimeout()
      this.receivedResp = payload
      this.matchReceive(payload)
    })

    this.timeoutTimer = setTimeout(() => {
      this.trigger('timeout', {})
    }, this.timeout)
  }

  /**
   * @private
   */
  hasReceived(status) {
    return this.receivedResp && this.receivedResp.status === status
  }

  /**
   * @private
   */
  trigger(status, response) {
    this.channel.trigger(this.refEvent, { status, response })
  }
}

/**
 *
 * @param {string} topic
 * @param {(Object|function)} params
 * @param {Socket} socket
 */
export class Channel {
  public topic: string
  public params: any
  public socket: Socket
  public state: CHANNEL_STATES
  public bindingRef: number
  public pushBuffer: Push[]
  public bindings: Binding[]
  public rejoinTimer: Timer
  public joinPush: Push
  public timeout: number
  public stateChangeRefs: string[]
  public joinedOnce: boolean
  constructor(topic: string, params: any, socket: Socket) {
    this.state = CHANNEL_STATES.closed
    this.topic = topic
    this.params = closure(params || {})
    this.socket = socket
    this.bindings = []
    this.bindingRef = 0
    this.timeout = this.socket.timeout
    this.joinedOnce = false
    this.joinPush = new Push(
      this,
      CHANNEL_EVENTS.join,
      this.params,
      this.timeout
    )
    this.pushBuffer = []
    this.stateChangeRefs = []

    this.rejoinTimer = new Timer(() => {
      if (this.socket.isConnected()) {
        this.rejoin()
      }
    }, this.socket.rejoinAfterMs)
    this.stateChangeRefs.push(
      this.socket.onError(() => this.rejoinTimer.reset())
    )
    this.stateChangeRefs.push(
      this.socket.onOpen(() => {
        this.rejoinTimer.reset()
        if (this.isErrored()) {
          this.rejoin()
        }
      })
    )
    this.joinPush.receive('ok', () => {
      this.state = CHANNEL_STATES.joined
      this.rejoinTimer.reset()
      this.pushBuffer.forEach(pushEvent => pushEvent.send())
      this.pushBuffer = []
    })
    this.joinPush.receive('error', () => {
      this.state = CHANNEL_STATES.errored
      if (this.socket.isConnected()) {
        this.rejoinTimer.scheduleTimeout()
      }
    })
    this.onClose(() => {
      this.rejoinTimer.reset()
      if (this.socket.hasLogger())
        this.socket.log('channel', `close ${this.topic} ${this.joinRef()}`)
      this.state = CHANNEL_STATES.closed
      this.socket.remove(this)
    })
    this.onError(reason => {
      if (this.socket.hasLogger())
        this.socket.log('channel', `error ${this.topic}`, reason)
      if (this.isJoining()) {
        this.joinPush.reset()
      }
      this.state = CHANNEL_STATES.errored
      if (this.socket.isConnected()) {
        this.rejoinTimer.scheduleTimeout()
      }
    })
    this.joinPush.receive('timeout', () => {
      if (this.socket.hasLogger())
        this.socket.log(
          'channel',
          `timeout ${this.topic} (${this.joinRef()})`,
          this.joinPush.timeout
        )
      let leavePush = new Push(
        this,
        CHANNEL_EVENTS.leave,
        closure({}),
        this.timeout
      )
      leavePush.send()
      this.state = CHANNEL_STATES.errored
      this.joinPush.reset()
      if (this.socket.isConnected()) {
        this.rejoinTimer.scheduleTimeout()
      }
    })
    this.on(CHANNEL_EVENTS.reply, (payload, ref) => {
      this.trigger(this.replyEventName(ref), payload)
    })
  }

  /**
   * Join the channel
   * @param {integer} timeout
   * @returns {Push}
   */
  join(timeout = this.timeout) {
    if (this.joinedOnce) {
      throw new Error(
        `tried to join multiple times. 'join' can only be called a single time per channel instance`
      )
    } else {
      this.timeout = timeout
      this.joinedOnce = true
      this.rejoin()
      return this.joinPush
    }
  }

  /**
   * Hook into channel close
   * @param {Function} callback
   */
  onClose(callback) {
    this.on(CHANNEL_EVENTS.close, callback)
  }

  /**
   * Hook into channel errors
   * @param {Function} callback
   */
  onError(callback) {
    return this.on(CHANNEL_EVENTS.error, reason => callback(reason))
  }

  /**
   * Subscribes on channel events
   *
   * Subscription returns a ref counter, which can be used later to
   * unsubscribe the exact event listener
   *
   * @example
   * const ref1 = channel.on("event", do_stuff)
   * const ref2 = channel.on("event", do_other_stuff)
   * channel.off("event", ref1)
   * // Since unsubscription, do_stuff won't fire,
   * // while do_other_stuff will keep firing on the "event"
   *
   * @param {string} event
   * @param {Function} callback
   * @returns {integer} ref
   */
  on(event: string, callback: BindingCB) {
    let ref = (this.bindingRef++).toString()
    this.bindings.push({ event, ref, callback })
    return ref
  }

  /**
   * Unsubscribes off of channel events
   *
   * Use the ref returned from a channel.on() to unsubscribe one
   * handler, or pass nothing for the ref to unsubscribe all
   * handlers for the given event.
   *
   * @example
   * // Unsubscribe the do_stuff handler
   * const ref1 = channel.on("event", do_stuff)
   * channel.off("event", ref1)
   *
   * // Unsubscribe all handlers from event
   * channel.off("event")
   *
   * @param {string} event
   * @param {integer} ref
   */
  off(event: string, ref?: string) {
    this.bindings = this.bindings.filter(bind => {
      return !(
        bind.event === event &&
        (typeof ref === 'undefined' || ref === bind.ref)
      )
    })
  }

  /**
   * @private
   */
  canPush() {
    return this.socket.isConnected() && this.isJoined()
  }

  /**
   * Sends a message `event` to phoenix with the payload `payload`.
   * Phoenix receives this in the `handle_in(event, payload, socket)`
   * function. if phoenix replies or it times out (default 10000ms),
   * then optionally the reply can be received.
   *
   * @example
   * channel.push("event")
   *   .receive("ok", payload => console.log("phoenix replied:", payload))
   *   .receive("error", err => console.log("phoenix errored", err))
   *   .receive("timeout", () => console.log("timed out pushing"))
   * @param {string} event
   * @param {Object} payload
   * @param {number} [timeout]
   * @returns {Push}
   */
  push(event: string, payload: any, timeout = this.timeout) {
    if (!this.joinedOnce) {
      throw new Error(
        `tried to push '${event}' to '${
          this.topic
        }' before joining. Use channel.join() before pushing events`
      )
    }
    let pushEvent = new Push(
      this,
      event,
      function() {
        return payload
      },
      timeout
    )
    if (this.canPush()) {
      pushEvent.send()
    } else {
      pushEvent.startTimeout()
      this.pushBuffer.push(pushEvent)
    }

    return pushEvent
  }

  /** Leaves the channel
   *
   * Unsubscribes from server events, and
   * instructs channel to terminate on server
   *
   * Triggers onClose() hooks
   *
   * To receive leave acknowledgements, use the `receive`
   * hook to bind to the server ack, ie:
   *
   * @example
   * channel.leave().receive("ok", () => alert("left!") )
   *
   * @param {integer} timeout
   * @returns {Push}
   */
  leave(timeout = this.timeout) {
    this.rejoinTimer.reset()
    this.joinPush.cancelTimeout()

    this.state = CHANNEL_STATES.leaving
    const onClose = () => {
      if (this.socket.hasLogger()) {
        this.socket.log('channel', `leave ${this.topic}`)
      }
      this.trigger(CHANNEL_EVENTS.close, 'leave')
    }
    const leavePush = new Push(this, CHANNEL_EVENTS.leave, closure({}), timeout)
    leavePush.receive('ok', () => onClose()).receive('timeout', () => onClose())
    leavePush.send()
    if (!this.canPush()) {
      leavePush.trigger('ok', {})
    }

    return leavePush
  }

  /**
   * Overridable message hook
   *
   * Receives all events for specialized message handling
   * before dispatching to the channel callbacks.
   *
   * Must return the payload, modified or unmodified
   * @param {string} event
   * @param {Object} payload
   * @param {integer} ref
   * @returns {Object}
   */
  onMessage(_: string, payload: any, __?: string, ___?: string) {
    return payload
  }

  /**
   * @private
   */
  isLifecycleEvent(event: CHANNEL_EVENTS) {
    return CHANNEL_LIFECYCLE_EVENTS.indexOf(event) >= 0
  }

  /**
   * @private
   */
  isMember(
    topic: string,
    event: CHANNEL_EVENTS,
    payload: any,
    joinRef: string
  ) {
    if (this.topic !== topic) {
      return false
    }

    if (joinRef && joinRef !== this.joinRef() && this.isLifecycleEvent(event)) {
      if (this.socket.hasLogger()) {
        this.socket.log('channel', 'dropping outdated message', {
          topic,
          event,
          payload,
          joinRef
        })
      }
      return false
    } else {
      return true
    }
  }

  /**
   * @private
   */
  joinRef() {
    return this.joinPush.ref
  }

  /**
   * @private
   */
  rejoin(timeout = this.timeout) {
    if (this.isLeaving()) {
      return
    }
    this.socket.leaveOpenTopic(this.topic)
    this.state = CHANNEL_STATES.joining
    this.joinPush.resend(timeout)
  }

  /**
   * @private
   */
  trigger(event: string, payload?: any, ref?: string, joinRef?: string) {
    const handledPayload = this.onMessage(event, payload, ref, joinRef)
    if (payload && !handledPayload) {
      throw new Error(
        'channel onMessage callbacks must return the payload, modified or unmodified'
      )
    }

    const eventBindings = this.bindings.filter(bind => bind.event === event)

    for (let i = 0; i < eventBindings.length; i++) {
      const bind = eventBindings[i]
      bind.callback(handledPayload, ref, joinRef || this.joinRef())
    }
  }

  /**
   * @private
   */
  replyEventName(ref) {
    return `chan_reply_${ref}`
  }

  /**
   * @private
   */
  isClosed() {
    return this.state === CHANNEL_STATES.closed
  }

  /**
   * @private
   */
  isErrored() {
    return this.state === CHANNEL_STATES.errored
  }

  /**
   * @private
   */
  isJoined() {
    return this.state === CHANNEL_STATES.joined
  }

  /**
   * @private
   */
  isJoining() {
    return this.state === CHANNEL_STATES.joining
  }

  /**
   * @private
   */
  isLeaving() {
    return this.state === CHANNEL_STATES.leaving
  }
}

/* The default serializer for encoding and decoding messages */
export let Serializer = {
  encode(msg: any, callback: (s: string) => void) {
    const encoded = JSON.stringify([
      msg.join_ref,
      msg.ref,
      msg.topic,
      msg.event,
      msg.payload
    ])
    return callback(encoded)
  },

  decode(rawPayload: string, callback: (a: any) => void) {
    const [join_ref, ref, topic, event, payload] = JSON.parse(rawPayload)

    return callback({ join_ref, ref, topic, event, payload })
  }
}

/** Initializes the Socket
 *
 *
 * For IE8 support use an ES5-shim (https://github.com/es-shims/es5-shim)
 *
 * @param {string} endPoint - The string WebSocket endpoint, ie, `"ws://example.com/socket"`,
 *                                               `"wss://example.com"`
 *                                               `"/socket"` (inherited host & protocol)
 * @param {Object} [opts] - Optional configuration
 * @param {string} [opts.transport] - The Websocket Transport, for example WebSocket or Phoenix.LongPoll.
 *
 * Defaults to WebSocket with automatic LongPoll fallback.
 * @param {Function} [opts.encode] - The function to encode outgoing messages.
 *
 * Defaults to JSON encoder.
 *
 * @param {Function} [opts.decode] - The function to decode incoming messages.
 *
 * Defaults to JSON:
 *
 * ```javascript
 * (payload, callback) => callback(JSON.parse(payload))
 * ```
 *
 * @param {number} [opts.timeout] - The default timeout in milliseconds to trigger push timeouts.
 *
 * Defaults `DEFAULT_TIMEOUT`
 * @param {number} [opts.heartbeatIntervalMs] - The millisec interval to send a heartbeat message
 * @param {number} [opts.reconnectAfterMs] - The optional function that returns the millsec
 * socket reconnect interval.
 *
 * Defaults to stepped backoff of:
 *
 * ```javascript
 * function(tries){
 *   return [10, 50, 100, 150, 200, 250, 500, 1000, 2000][tries - 1] || 5000
 * }
 * ````
 *
 * @param {number} [opts.rejoinAfterMs] - The optional function that returns the millsec
 * rejoin interval for individual channels.
 *
 * ```javascript
 * function(tries){
 *   return [1000, 2000, 5000][tries - 1] || 10000
 * }
 * ````
 *
 * @param {Function} [opts.logger] - The optional function for specialized logging, ie:
 *
 * ```javascript
 * function(kind, msg, data) {
 *   console.log(`${kind}: ${msg}`, data)
 * }
 * ```
 *
 * @param {number} [opts.longpollerTimeout] - The maximum timeout of a long poll AJAX request.
 *
 * Defaults to 20s (double the server long poll timer).
 *
 * @param {{Object|function)} [opts.params] - The optional params to pass when connecting
 * @param {string} [opts.binaryType] - The binary type to use for binary WebSocket frames.
 *
 * Defaults to "arraybuffer"
 *
 * @param {vsn} [opts.vsn] - The serializer's protocol version to send on connect.
 *
 * Defaults to DEFAULT_VSN.
 */
type EncodeFn = (any, cb: (a: any) => void) => void
type DecodeFn = (any, cb: (a: any) => void) => void
type SequenceFn = (n: number) => number
interface SocketLike {
  send(p: any): void
  close(code?: number, reason?: string): void
  binaryType: string
  timeout: number
  skipHeartbeat: boolean
  onopen: (a: any) => void
  onerror: (a: any) => void
  bufferedAmount: number
  readyState: SOCKET_STATES
  onmessage: (a: any) => void
  onclose: (a: any) => void
}
type Logger = (a: string, b?: string, d?: any) => void
interface SocketOpts {
  transport: (endpoint: string) => SocketLike
  timeout: number
  heartbeatIntervalMs: number
  binaryType: string
  rejoinAfterMs: SequenceFn
  reconnectAfterMs: SequenceFn
  decode: DecodeFn
  vsn: string
  encode: EncodeFn
  params: any
  longpollerTimeout: number
  logger: Logger

  automaticReconnect: boolean
}

export class Socket {
  public timeout: number
  public ref: number
  public channels: Channel[]
  public sendBuffer: any[]
  public stateChangeCallbacks = { open: [], close: [], error: [], message: [] }
  public transport: any
  public defaultEncoder: EncodeFn
  public encode: EncodeFn

  public defaultDecoder: (any, cb: (a: any) => void) => void
  public decode: (any, cb: (a: any) => void) => void
  public closeWasClean: boolean
  public unloaded: boolean
  public binaryType: string

  public conn: SocketLike
  public vsn: string
  public heartbeatIntervalMs: number
  public rejoinAfterMs: SequenceFn
  public reconnectAfterMs: SequenceFn
  public logger: Logger
  public endPoint: string
  public longpollerTimeout: number
  public params: any
  public reconnectTimer: Timer
  public heartbeatTimer: NodeJS.Timer | null
  public pendingHeartbeatRef: string
  public automaticReconnect: boolean
  constructor(endPoint: string, opts: Partial<SocketOpts> = {}) {
    this.channels = []
    this.sendBuffer = []
    this.ref = 0
    this.timeout = opts.timeout || DEFAULT_TIMEOUT
    this.transport = opts.transport || WebSocket
    this.defaultEncoder = Serializer.encode
    this.defaultDecoder = Serializer.decode
    this.closeWasClean = false
    this.unloaded = false
    this.binaryType = opts.binaryType || 'arraybuffer'
    this.encode = opts.encode || this.defaultEncoder
    this.decode = opts.decode || this.defaultDecoder
    this.automaticReconnect = opts.automaticReconnect || true
    process.on('exit', () => {
      if (this.conn) {
        this.unloaded = true
        this.abnormalClose('unloaded')
      }
    })
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 30000
    this.rejoinAfterMs = tries => {
      if (opts.rejoinAfterMs) {
        return opts.rejoinAfterMs(tries)
      } else {
        return [1000, 2000, 5000][tries - 1] || 10000
      }
    }
    this.reconnectAfterMs = tries => {
      if (this.unloaded) {
        return 100
      }
      if (opts.reconnectAfterMs) {
        return opts.reconnectAfterMs(tries)
      } else {
        return [10, 50, 100, 150, 200, 250, 500, 1000, 2000][tries - 1] || 5000
      }
    }
    this.logger = opts.logger || null
    this.longpollerTimeout = opts.longpollerTimeout || 20000
    this.params = closure(opts.params || {})
    this.endPoint = `${endPoint}/${TRANSPORTS.websocket}`
    this.vsn = opts.vsn || DEFAULT_VSN
    this.heartbeatTimer = null
    this.pendingHeartbeatRef = null
    this.reconnectTimer = new Timer(() => {
      this.teardown(() => this.connect())
    }, this.reconnectAfterMs)
  }

  /**
   * Returns the socket protocol
   *
   * @returns {string}
   */
  protocol() {
    return location.protocol.match(/^https/) ? 'wss' : 'ws'
  }

  /**
   * The fully qualifed socket url
   *
   * @returns {string}
   */
  endPointURL(): string {
    const uri =
      this.endPoint +
      '?' +
      queryString.encode({
        ...this.params(),
        vsn: this.vsn
      })
    if (uri.charAt(0) !== '/') {
      return uri
    }
    if (uri.charAt(1) === '/') {
      return `${this.protocol()}:${uri}`
    }

    return `${this.protocol()}://${location.host}${uri}`
  }

  /**
   * Disconnects the socket
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for valid status codes.
   *
   * @param {Function} callback - Optional callback which is called after socket is disconnected.
   * @param {integer} code - A status code for disconnection (Optional).
   * @param {string} reason - A textual description of the reason to disconnect. (Optional)
   */
  disconnect(callback: () => void, code: number, reason: string) {
    this.closeWasClean = true
    this.reconnectTimer.reset()
    this.teardown(callback, code, reason)
  }

  /**
   *
   * @param {Object} params - The params to send when connecting, for example `{user_id: userToken}`
   *
   * Passing params to connect is deprecated; pass them in the Socket constructor instead:
   * `new Socket("/socket", {params: {user_id: userToken}})`.
   */
  connect(params?: any) {
    if (params) {
      console &&
        console.log(
          'passing params to connect is deprecated. Instead pass :params to the Socket constructor'
        )
      this.params = closure(params)
    }
    if (this.conn) {
      return
    }
    this.closeWasClean = false
    this.conn = new this.transport(this.endPointURL())
    this.conn.binaryType = this.binaryType
    this.conn.timeout = this.longpollerTimeout
    this.conn.onopen = () => this.onConnOpen()
    this.conn.onerror = error => this.onConnError(error)
    this.conn.onmessage = event => this.onConnMessage(event)
    this.conn.onclose = event => this.onConnClose(event)
  }

  /**
   * Logs the message. Override `this.logger` for specialized logging. noops by default
   * @param {string} kind
   * @param {string} msg
   * @param {Object} data
   */
  log(kind: string, msg: string, data?: any) {
    this.logger(kind, msg, data)
  }

  /**
   * Returns true if a logger has been set on this socket.
   */
  hasLogger() {
    return this.logger !== null
  }

  /**
   * Registers callbacks for connection open events
   *
   * @example socket.onOpen(function(){ console.info("the socket was opened") })
   *
   * @param {Function} callback
   */
  onOpen(callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.open.push([ref, callback])
    return ref
  }

  /**
   * Registers callbacks for connection close events
   * @param {Function} callback
   */
  onClose(callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.close.push([ref, callback])
    return ref
  }

  /**
   * Registers callbacks for connection error events
   *
   * @example socket.onError(function(error){ alert("An error occurred") })
   *
   * @param {Function} callback
   */
  onError(callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.error.push([ref, callback])
    return ref
  }

  /**
   * Registers callbacks for connection message events
   * @param {Function} callback
   */
  onMessage(callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.message.push([ref, callback])
    return ref
  }

  /**
   * @private
   */
  onConnOpen() {
    if (this.hasLogger())
      this.log('transport', `connected to ${this.endPointURL()}`)
    this.unloaded = false
    this.closeWasClean = false
    this.flushSendBuffer()
    this.reconnectTimer.reset()
    this.resetHeartbeat()
    this.stateChangeCallbacks.open.forEach(([, callback]) => callback())
  }

  /**
   * @private
   */

  resetHeartbeat() {
    if (this.conn && this.conn.skipHeartbeat) {
      return
    }
    this.pendingHeartbeatRef = null
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = setInterval(
      () => this.sendHeartbeat(),
      this.heartbeatIntervalMs
    )
  }

  teardown(callback?: () => void, code?: number, reason?: string) {
    if (!this.conn) {
      return callback && callback()
    }

    this.waitForBufferDone(() => {
      if (this.conn) {
        if (code) {
          this.conn.close(code, reason || '')
        } else {
          this.conn.close()
        }
      }

      this.waitForSocketClosed(() => {
        if (this.conn) {
          this.conn.onclose = function() {} // noop
          this.conn = null
        }

        callback && callback()
      })
    })
  }

  waitForBufferDone(callback, tries = 1) {
    if (tries === 5 || !this.conn || !this.conn.bufferedAmount) {
      callback()
      return
    }

    setTimeout(() => {
      this.waitForBufferDone(callback, tries + 1)
    }, 150 * tries)
  }

  waitForSocketClosed(callback, tries = 1) {
    if (
      tries === 5 ||
      !this.conn ||
      this.conn.readyState === SOCKET_STATES.closed
    ) {
      callback()
      return
    }

    setTimeout(() => {
      this.waitForSocketClosed(callback, tries + 1)
    }, 150 * tries)
  }

  onConnClose(event) {
    if (this.hasLogger()) this.log('transport', 'close', event)
    this.triggerChanError()
    clearInterval(this.heartbeatTimer)
    if (!this.automaticReconnect) {
      this.disconnect(() => {}, SOCKET_STATES.closed, 'close')
    }
    if (!this.closeWasClean) {
      this.reconnectTimer.scheduleTimeout()
    }
    this.stateChangeCallbacks.close.forEach(([, callback]) => callback(event))
  }

  /**
   * @private
   */
  onConnError(error) {
    if (this.hasLogger()) this.log('transport', error)
    this.triggerChanError()
    this.stateChangeCallbacks.error.forEach(([, callback]) => callback(error))
  }

  /**
   * @private
   */
  triggerChanError() {
    this.channels.forEach(channel => {
      if (!(channel.isErrored() || channel.isLeaving() || channel.isClosed())) {
        channel.trigger(CHANNEL_EVENTS.error)
      }
    })
  }

  /**
   * @returns {string}
   */
  connectionState() {
    switch (this.conn && this.conn.readyState) {
      case SOCKET_STATES.connecting:
        return 'connecting'
      case SOCKET_STATES.open:
        return 'open'
      case SOCKET_STATES.closing:
        return 'closing'
      default:
        return 'closed'
    }
  }

  /**
   * @returns {boolean}
   */
  isConnected() {
    return this.connectionState() === 'open'
  }

  /**
   * @private
   *
   * @param {Channel}
   */
  remove(channel) {
    this.off(channel.stateChangeRefs)
    this.channels = this.channels.filter(c => c.joinRef() !== channel.joinRef())
  }

  /**
   * Removes `onOpen`, `onClose`, `onError,` and `onMessage` registrations.
   *
   * @param {refs} - list of refs returned by calls to
   *                 `onOpen`, `onClose`, `onError,` and `onMessage`
   */
  off(refs) {
    for (let key in this.stateChangeCallbacks) {
      this.stateChangeCallbacks[key] = this.stateChangeCallbacks[key].filter(
        ([ref]) => {
          return refs.indexOf(ref) === -1
        }
      )
    }
  }

  /**
   * Initiates a new channel for the given topic
   *
   * @param {string} topic
   * @param {Object} chanParams - Parameters for the channel
   * @returns {Channel}
   */
  channel(topic, chanParams = {}) {
    const chan = new Channel(topic, chanParams, this)
    this.channels.push(chan)
    return chan
  }

  /**
   * @param {Object} data
   */
  push(data: any) {
    if (this.hasLogger()) {
      let { topic, event, payload, ref, join_ref } = data
      this.log('push', `${topic} ${event} (${join_ref}, ${ref})`, payload)
    }

    if (this.isConnected()) {
      this.encode(data, result => this.conn.send(result))
    } else {
      this.sendBuffer.push(() =>
        this.encode(data, result => this.conn.send(result))
      )
    }
  }

  /**
   * Return the next message ref, accounting for overflows
   * @returns {string}
   */
  makeRef() {
    const newRef = this.ref + 1
    if (newRef === this.ref) {
      this.ref = 0
    } else {
      this.ref = newRef
    }

    return this.ref.toString()
  }

  sendHeartbeat() {
    if (!this.isConnected()) {
      return
    }
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null
      if (this.hasLogger())
        this.log(
          'transport',
          'heartbeat timeout. Attempting to re-establish connection'
        )
      this.abnormalClose('heartbeat timeout')
      return
    }
    this.pendingHeartbeatRef = this.makeRef()
    this.push({
      topic: 'phoenix',
      event: 'heartbeat',
      payload: {},
      ref: this.pendingHeartbeatRef
    })
  }

  abnormalClose(reason) {
    this.closeWasClean = false
    this.conn.close(WS_CLOSE_NORMAL, reason)
  }

  flushSendBuffer() {
    if (this.isConnected() && this.sendBuffer.length > 0) {
      this.sendBuffer.forEach(callback => callback())
      this.sendBuffer = []
    }
  }

  onConnMessage(rawMessage) {
    this.decode(rawMessage.data, msg => {
      let { topic, event, payload, ref, join_ref } = msg
      if (ref && ref === this.pendingHeartbeatRef) {
        this.pendingHeartbeatRef = null
      }

      if (this.hasLogger())
        this.log(
          'receive',
          `${payload.status || ''} ${topic} ${event} ${(ref &&
            '(' + ref + ')') ||
            ''}`,
          payload
        )

      for (let i = 0; i < this.channels.length; i++) {
        const channel = this.channels[i]
        if (!channel.isMember(topic, event, payload, join_ref)) {
          continue
        }
        channel.trigger(event, payload, ref, join_ref)
      }

      for (let i = 0; i < this.stateChangeCallbacks.message.length; i++) {
        let [, callback] = this.stateChangeCallbacks.message[i]
        callback(msg)
      }
    })
  }

  leaveOpenTopic(topic) {
    let dupChannel = this.channels.find(
      c => c.topic === topic && (c.isJoined() || c.isJoining())
    )
    if (dupChannel) {
      if (this.hasLogger())
        this.log('transport', `leaving duplicate topic "${topic}"`)
      dupChannel.leave()
    }
  }
}

/**
 *
 * Creates a timer that accepts a `timerCalc` function to perform
 * calculated timeout retries, such as exponential backoff.
 *
 * @example
 * let reconnectTimer = new Timer(() => this.connect(), function(tries){
 *   return [1000, 5000, 10000][tries - 1] || 10000
 * })
 * reconnectTimer.scheduleTimeout() // fires after 1000
 * reconnectTimer.scheduleTimeout() // fires after 5000
 * reconnectTimer.reset()
 * reconnectTimer.scheduleTimeout() // fires after 1000
 *
 * @param {Function} callback
 * @param {Function} timerCalc
 */
class Timer {
  public timer: NodeJS.Timer
  public tries: number
  public callback: () => void
  public timerCalc: SequenceFn
  constructor(callback: () => void, timerCalc: SequenceFn) {
    this.callback = callback
    this.timerCalc = timerCalc
    this.timer = null
    this.tries = 0
  }

  reset() {
    this.tries = 0
    clearTimeout(this.timer)
  }

  /**
   * Cancels any previous scheduleTimeout and schedules callback
   */
  scheduleTimeout() {
    clearTimeout(this.timer)

    this.timer = setTimeout(() => {
      this.tries = this.tries + 1
      this.callback()
    }, this.timerCalc(this.tries + 1))
  }
}
