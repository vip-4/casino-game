var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../.nvm/versions/node/v22.22.3/lib/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// index.js
function getConfig(env2) {
  return {
    // GEO 区域 → 地区映射 (request.cf.country → regionCode)
    regionMapping: JSON.parse(env2.REGION_MAPPING || JSON.stringify({
      // 大中华区 → cn (近源中转)
      CN: "cn",
      HK: "cn",
      TW: "cn",
      MO: "cn",
      // 东南亚 → sea
      SG: "sea",
      MY: "sea",
      TH: "sea",
      VN: "sea",
      ID: "sea",
      PH: "sea",
      IN: "sea",
      // 北美 → en
      US: "en",
      CA: "en",
      // 大洋洲 → en
      AU: "en",
      NZ: "en",
      // 欧洲 → eu
      GB: "eu",
      DE: "eu",
      FR: "eu",
      NL: "eu",
      ES: "eu",
      IT: "eu",
      // 日韩 → jpkr
      JP: "jpkr",
      KR: "jpkr"
    })),
    // 默认兜底区域
    defaultRegion: env2.DEFAULT_REGION || "global",
    // ── 区域源站配置 ──────────────────────────────────────────────────
    // origin:    上游源站 (Pages 或自建)
    // cnProxy:   CN 专属中转代理 (可指向国内加速节点或另一个 Worker)
    // r2Prefix:  R2 区域桶前缀
    // cacheTtl:  浏览器缓存 (秒)
    // cdnCacheTtl: CDN 边缘缓存 (秒)
    // surgeProtect: 是否启用源站保护 (CN 专属)
    regions: JSON.parse(env2.REGIONS || JSON.stringify({
      cn: {
        origin: "https://h5games-3hm.pages.dev",
        cnProxy: null,
        // 可设为 'https://cn-proxy.workers.dev' 等国内加速节点
        r2Prefix: "cn",
        cacheTtl: 300,
        // HTML 浏览器缓存 5min
        cdnCacheTtl: 86400,
        // CDN 缓存 24h
        surgeProtect: true
        // CN 开启源站保护
      },
      en: {
        origin: "https://h5games-3hm.pages.dev",
        r2Prefix: "en",
        cacheTtl: 300,
        cdnCacheTtl: 86400
      },
      eu: {
        origin: "https://h5games-3hm.pages.dev",
        r2Prefix: "eu",
        cacheTtl: 300,
        cdnCacheTtl: 86400
      },
      sea: {
        origin: "https://h5games-3hm.pages.dev",
        r2Prefix: "sea",
        cacheTtl: 300,
        cdnCacheTtl: 86400
      },
      jpkr: {
        origin: "https://h5games-3hm.pages.dev",
        r2Prefix: "jpkr",
        cacheTtl: 300,
        cdnCacheTtl: 86400
      },
      global: {
        origin: "https://h5games-3hm.pages.dev",
        r2Prefix: "global",
        cacheTtl: 600,
        cdnCacheTtl: 86400
      }
    })),
    // 预渲染页面路径 (先从 R2 区域桶读, 再回退到源站)
    prerenderedPaths: JSON.parse(env2.PRERENDERED_PATHS || '["/","/index.html"]'),
    // 静态资源扩展名
    staticExtensions: (env2.STATIC_EXTENSIONS || ".js,.css,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico,.woff,.woff2,.ttf,.mp3,.wav,.ogg,.mp4,.webm,.wasm").split(","),
    // API 绕过路径
    apiBypassPaths: (env2.API_BYPASS_PATHS || "/api/,/ws,/health,/__debug,/__scheduled").split(",").map((p) => p.trim()),
    // 静态资源缓存 (浏览器 / CDN)
    staticCacheTTL: parseInt(env2.STATIC_CACHE_TTL || "31536000"),
    // 1 年
    cdnStaticCacheTTL: parseInt(env2.CDN_STATIC_CACHE_TTL || "31536000"),
    // 部署版本
    deployVersion: env2.DEPLOY_VERSION || "4.0.0",
    siteName: env2.SITE_NAME || "H5 Games Arcade",
    siteUrl: env2.SITE_URL || "https://h5games-3hm.pages.dev",
    // Canary / A/B (可选)
    canaryPercentage: parseInt(env2.CANARY_PCT || "0"),
    canaryUrl: env2.CANARY_URL || "",
    abTestRatio: parseInt(env2.AB_TEST_RATIO || "0"),
    abVariantUrl: env2.AB_VARIANT_URL || "",
    // 管理员调试 IP
    adminIp: env2.ADMIN_IP || "",
    // ── Cache API 配置 ────────────────────────────────────────────────
    // 启用 Cache API 显式缓存 (caches.default)
    enableCacheApi: env2.ENABLE_CACHE_API !== "false",
    // Cache API 缓存 TTL (秒) — 比浏览器/CDN 缓存更长以降低回源
    cacheApiTtl: parseInt(env2.CACHE_API_TTL || "86400"),
    // 24h
    cacheApiStaticTtl: parseInt(env2.CACHE_API_STATIC_TTL || "604800")
    // 7d
  };
}
__name(getConfig, "getConfig");
function isStaticAsset(pathname, extensions) {
  const lower = pathname.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}
__name(isStaticAsset, "isStaticAsset");
function isApiBypass(pathname, apiBypassPaths) {
  return apiBypassPaths.some((p) => pathname.startsWith(p));
}
__name(isApiBypass, "isApiBypass");
function getDeviceType(userAgent) {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/(android|iphone|ipad|ipod|mobile|blackberry|webos|opera mini)/.test(ua)) {
    if (/(tablet|ipad)/.test(ua) && !/mobile/.test(ua)) return "tablet";
    return "mobile";
  }
  return "desktop";
}
__name(getDeviceType, "getDeviceType");
function getPreferredLanguage(acceptLang) {
  if (!acceptLang) return "en";
  const langs = acceptLang.split(",");
  for (const entry of langs) {
    const [lang] = entry.split(";");
    const code = lang.trim().split("-")[0].toLowerCase();
    if (["zh", "en", "ja", "ko", "th", "vi", "id", "ms", "de", "fr", "es"].includes(code)) {
      return code;
    }
  }
  return "en";
}
__name(getPreferredLanguage, "getPreferredLanguage");
function buildCacheKey(region, deviceType, language, pathname) {
  const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return `v6__${region}__${deviceType}__${language}__${normalizedPath}`;
}
__name(buildCacheKey, "buildCacheKey");
function addLinkHeaders(response, request, region, pathname) {
  try {
    const url = new URL(request.url);
    const proto = url.protocol;
    const host = url.host;
    const regionLangMap = { cn: "zh-CN", en: "en", eu: "de", sea: "en", jpkr: "ja", global: "en" };
    const regionLinks = [];
    for (const [r, l] of Object.entries(regionLangMap)) {
      regionLinks.push(`<${proto}//${host}/${r}${pathname}>; rel="alternate"; hreflang="${l}"`);
    }
    regionLinks.push(`<${proto}//${host}/global${pathname}>; rel="alternate"; hreflang="x-default"`);
    response.headers.set("Link", regionLinks.join(", "));
    response.headers.set("X-SEO-Region", region);
  } catch (e) {
    console.error("[LinkHeader] error:", e);
  }
}
__name(addLinkHeaders, "addLinkHeaders");
function setCacheHeaders(response, config2, region, deviceType, language, pathname, contentType) {
  const cacheKey = buildCacheKey(region, deviceType, language, pathname);
  response.headers.set("Cf-Cache-Key", cacheKey);
  const tags = [`region-${region}`, `device-${deviceType}`, `lang-${language}`];
  if (pathname === "/" || pathname.endsWith(".html")) {
    tags.push("html");
  } else if (contentType.includes("javascript") || pathname.endsWith(".js") || pathname.endsWith(".css")) {
    tags.push("static-script");
  } else if (contentType.includes("image") || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname)) {
    tags.push("static-image");
  }
  response.headers.set("Cache-Tag", tags.join(","));
  response.headers.set("X-Cache-Key", cacheKey);
}
__name(setCacheHeaders, "setCacheHeaders");
async function getFromCacheApi(request, cacheKey) {
  try {
    const cache = caches.default;
    const cacheRequest = new Request(`https://cache/${cacheKey}`, request);
    const cached = await cache.match(cacheRequest);
    if (cached) {
      const response = new Response(cached.body, cached);
      response.headers.set("X-Cache-API", "HIT");
      return response;
    }
  } catch (e) {
    console.error("[CacheAPI] read error:", e);
  }
  return null;
}
__name(getFromCacheApi, "getFromCacheApi");
async function putToCacheApi(request, response, cacheKey, ttl) {
  try {
    if (response.status >= 500) return;
    if (request.headers.has("Range")) return;
    if (request.method !== "GET") return;
    const cache = caches.default;
    const cacheRequest = new Request(`https://cache/${cacheKey}`, request);
    const clonedResponse = new Response(response.clone().body, response.clone());
    clonedResponse.headers.set("Cache-Control", `public, max-age=${ttl}`);
    clonedResponse.headers.set("X-Cache-API", "MISS");
    await cache.put(cacheRequest, clonedResponse);
  } catch (e) {
    console.error("[CacheAPI] write error:", e);
  }
}
__name(putToCacheApi, "putToCacheApi");
async function tryPrerenderedHtml(request, env2, region, pathname, config2) {
  let r2Key;
  if (pathname === "/" || pathname === "/index.html") {
    r2Key = `${region}/index.html`;
  } else if (pathname.startsWith(`/${region}/`)) {
    r2Key = `${region}${pathname.slice(region.length + 1)}`;
    if (!r2Key.endsWith(".html")) r2Key += ".html";
  } else if (pathname === `/${region}` || pathname === `/${region}/`) {
    r2Key = `${region}/index.html`;
  } else {
    r2Key = `${region}${pathname}`;
    if (!r2Key.endsWith(".html")) r2Key += ".html";
  }
  if (!r2Key.endsWith(".html")) return null;
  try {
    const object = await env2.REGIONAL_ASSETS.get(r2Key);
    if (!object) return null;
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("CDN-Cache-Control", `public, max-age=${config2.regions[region]?.cdnCacheTtl || 86400}`);
    const etag = object.httpEtag;
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (etag && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": "public, max-age=0, must-revalidate" }
      });
    }
    if (etag) headers.set("ETag", etag);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("X-Render-Type", "prerendered");
    headers.set("X-GEO-Region", region);
    const html = await responseText(object.body);
    const injectedHtml = injectSeoIntoHtml(html, request, region, config2);
    return new Response(injectedHtml, { status: 200, headers });
  } catch (e) {
    console.error(`[PreRender] error for ${r2Key}:`, e);
  }
  return null;
}
__name(tryPrerenderedHtml, "tryPrerenderedHtml");
function injectSeoIntoHtml(html, request, region, config2) {
  const url = new URL(request.url);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config2.siteName,
    url: url.origin,
    description: region === "cn" ? "\u514D\u8D39\u5728\u7EBFH5\u6E38\u620F - \u8D5B\u9A6C\u3001\u8001\u864E\u673A\u3001\u4E8C\u5341\u4E00\u70B9\u3001\u9AB0\u5B50\u7ADE\u6280" : region === "jpkr" ? "\u7121\u6599\u30AA\u30F3\u30E9\u30A4\u30F3H5\u30B2\u30FC\u30E0 - \u7AF6\u99AC\u3001\u30B9\u30ED\u30C3\u30C8\u3001\u30D6\u30E9\u30C3\u30AF\u30B8\u30E3\u30C3\u30AF" : "Free online H5 games - Horse racing, slots, blackjack, dice arena",
    inLanguage: region === "cn" ? "zh-CN" : region === "jpkr" ? "ja" : "en"
  };
  const jsonLdHtml = `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`;
  let result = html;
  if (result.includes("</head>")) {
    result = result.replace("</head>", `${jsonLdHtml}
</head>`);
  }
  const metaRegion = `<meta name="geo-region" content="${region}">`;
  const metaLang = `<meta name="geo-language" content="${region === "cn" ? "zh-CN" : region === "jpkr" ? "ja" : "en"}">`;
  result = result.replace("<head>", `<head>
${metaRegion}
${metaLang}`);
  return result;
}
__name(injectSeoIntoHtml, "injectSeoIntoHtml");
async function responseText(body) {
  if (typeof body === "string") return body;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}
__name(responseText, "responseText");
async function proxyRequest(request, targetUrl, timeoutMs = 1e4) {
  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set("X-Forwarded-Host", request.headers.get("Host") || "");
  proxyHeaders.set("X-Forwarded-Proto", request.url.startsWith("https") ? "https" : "http");
  const proxyReq = new Request(targetUrl, {
    method: request.method,
    headers: proxyHeaders,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : void 0,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs)
  });
  return fetch(proxyReq);
}
__name(proxyRequest, "proxyRequest");
var index_default = {
  async fetch(request, env2, ctx) {
    const config2 = getConfig(env2);
    const url = new URL(request.url);
    const pathname = url.pathname;
    const userAgent = request.headers.get("User-Agent") || "";
    const acceptLang = request.headers.get("Accept-Language") || "";
    if (pathname === "/health" || pathname === "/__health") {
      return new Response(JSON.stringify({
        status: "ok",
        worker: "geo-router-v4",
        timestamp: Date.now(),
        colo: request.cf?.colo || "unknown",
        country: request.cf?.country || "unknown"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
      });
    }
    if (pathname === "/__debug" && request.headers.get("cf-connecting-ip") === config2.adminIp) {
      return new Response(JSON.stringify({
        country: request.cf?.country,
        colo: request.cf?.colo,
        continent: request.cf?.continent,
        city: request.cf?.city,
        timezone: request.cf?.timezone,
        deviceType: getDeviceType(userAgent),
        language: getPreferredLanguage(acceptLang),
        regions: Object.keys(config2.regions)
      }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
      });
    }
    const country = request.cf && request.cf.country || "";
    const regionCode = config2.regionMapping[country] || config2.defaultRegion;
    const regionConfig = config2.regions[regionCode] || config2.regions[config2.defaultRegion];
    const deviceType = getDeviceType(userAgent);
    const language = getPreferredLanguage(acceptLang);
    const isChinaUser = country === "CN";
    const cnProxyOrigin = isChinaUser && regionConfig && regionConfig.cnProxy ? regionConfig.cnProxy : null;
    const cacheKey = buildCacheKey(regionCode, deviceType, language, pathname);
    const canCache = request.method === "GET" && !isApiBypass(pathname, config2.apiBypassPaths) && !pathname.startsWith("/health") && !pathname.startsWith("/__debug");
    if (config2.enableCacheApi && canCache) {
      const cachedResponse = await getFromCacheApi(request, cacheKey);
      if (cachedResponse) {
        setCacheHeaders(cachedResponse, config2, regionCode, deviceType, language, pathname, cachedResponse.headers.get("Content-Type") || "");
        if ((cachedResponse.headers.get("Content-Type") || "").includes("text/html")) {
          addLinkHeaders(cachedResponse, request, regionCode, pathname);
        }
        return cachedResponse;
      }
    }
    if (canCache && !isStaticAsset(pathname, config2.staticExtensions)) {
      const prerendered = await tryPrerenderedHtml(request, env2, regionCode, pathname, config2);
      if (prerendered) {
        setCacheHeaders(prerendered, config2, regionCode, deviceType, language, pathname, "text/html");
        prerendered.headers.set("X-Cache", "PRERENDERED");
        prerendered.headers.set("X-GEO-Region", regionCode);
        prerendered.headers.set("X-Country", country || "unknown");
        if (config2.enableCacheApi) {
          ctx.waitUntil(putToCacheApi(request, prerendered, cacheKey, config2.cacheApiTtl));
        }
        return prerendered;
      }
    }
    if (isStaticAsset(pathname, config2.staticExtensions)) {
      const staticRegionCfg = config2.regions && config2.regions[regionCode] ? config2.regions[regionCode] : (config2.regions && config2.regions[config2.defaultRegion]);
      const staticOrigin = staticRegionCfg ? staticRegionCfg.origin : null;
      const staticHeaders = new Headers(request.headers);
      staticHeaders.delete("host");
      const response = staticOrigin ? await fetch(new Request(staticOrigin + pathname + url.search, { method: "GET", headers: staticHeaders })) : await fetch(request);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("Cache-Control", `public, max-age=${config2.staticCacheTTL}, immutable`);
      newResponse.headers.set("CDN-Cache-Control", `public, max-age=${config2.cdnStaticCacheTTL}`);
      setCacheHeaders(newResponse, config2, regionCode, deviceType, language, pathname, response.headers.get("Content-Type") || "");
      newResponse.headers.set("X-Cache", "STATIC");
      if (config2.enableCacheApi) {
        ctx.waitUntil(putToCacheApi(request, newResponse, cacheKey, config2.cacheApiStaticTtl));
      }
      return newResponse;
    }
    if (isApiBypass(pathname, config2.apiBypassPaths)) {
      const response = await fetch(request);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      newResponse.headers.set("X-Cache", "BYPASS");
      return newResponse;
    }
    let originUrl = null;
    let routeAction = "geo-route";
    if (cnProxyOrigin) {
      originUrl = cnProxyOrigin + pathname + url.search;
      routeAction = "cn-proxy";
    } else if (regionConfig && regionConfig.origin) {
      originUrl = regionConfig.origin + pathname + url.search;
    }
    if (originUrl) {
      const proxyResponse = await proxyRequest(request, originUrl);
      const contentType = proxyResponse.headers.get("Content-Type") || "";
      let finalResponse;
      const isHead = request.method === "HEAD";
      if (contentType.includes("text/html") && !isHead) {
        const injectedBody = await responseText(proxyResponse.body);
        const seoHtml = injectSeoIntoHtml(injectedBody, request, regionCode, config2);
        finalResponse = new Response(seoHtml, {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          headers: proxyResponse.headers
        });
        finalResponse.headers.set("Content-Type", "text/html; charset=utf-8");
        finalResponse.headers.set("Cache-Control", `public, max-age=${regionConfig.cacheTtl || 300}, must-revalidate`);
        finalResponse.headers.set("CDN-Cache-Control", `public, max-age=${regionConfig.cdnCacheTtl || 86400}`);
      } else {
        finalResponse = new Response(isHead ? null : proxyResponse.body, proxyResponse);
        if (!finalResponse.headers.get("Cache-Control")) {
          finalResponse.headers.set("Cache-Control", "public, max-age=3600");
        }
      }
      setCacheHeaders(finalResponse, config2, regionCode, deviceType, language, pathname, contentType);
      finalResponse.headers.set("X-Cache", "GEO-PROXY");
      finalResponse.headers.set("X-GEO-Region", regionCode);
      finalResponse.headers.set("X-Device-Type", deviceType);
      finalResponse.headers.set("X-Language", language);
      finalResponse.headers.set("X-Route-Action", routeAction);
      finalResponse.headers.set("X-Country", country || "unknown");
      if (contentType.includes("text/html")) {
        const proto = url.protocol;
        const host = request.headers.get("Host") || url.hostname;
        const canonicalUrl = `${proto}//${host}${pathname}`;
        finalResponse.headers.set("Link", `<${canonicalUrl}>; rel="canonical"`);
        const regionLinks = [];
        const regionLangMap = { cn: "zh-CN", en: "en", eu: "en", sea: "en", jpkr: "ja", global: "en" };
        for (const [r, l] of Object.entries(regionLangMap)) {
          regionLinks.push(`<${proto}//${host}/${r}${pathname}>; rel="alternate"; hreflang="${l}"`);
        }
        regionLinks.push(`<${proto}//${host}/global${pathname}>; rel="alternate"; hreflang="x-default"`);
        finalResponse.headers.append("Link", regionLinks.join(", "));
      }
      if (config2.enableCacheApi && contentType.includes("text/html")) {
        ctx.waitUntil(putToCacheApi(request, finalResponse, cacheKey, config2.cacheApiTtl));
      } else if (config2.enableCacheApi) {
        ctx.waitUntil(putToCacheApi(request, finalResponse, cacheKey, config2.cacheApiStaticTtl));
      }
      return finalResponse;
    }
    return new Response(JSON.stringify({
      error: "service_unavailable",
      timestamp: Date.now(),
      country: country || "unknown"
    }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "30",
        "Cache-Control": "no-store"
      }
    });
  },
  // ─── Cron 定时: 健康检查 + 缓存预热 ──────────────────────
  async scheduled(event, env2, ctx) {
    const config2 = getConfig(env2);
    console.log("[Cron] Health check + cache warmup...");
    for (const [region, rc] of Object.entries(config2.regions)) {
      try {
        const start = Date.now();
        const resp = await fetch(rc.origin + "/health", { signal: AbortSignal.timeout(5e3) });
        const latency = Date.now() - start;
        console.log(`[Health] ${region} \u2192 ${resp.status} (${latency}ms)`);
      } catch (e) {
        console.error(`[Health] ${region} FAILED:`, e.message);
      }
      for (const p of config2.prerenderedPaths) {
        try {
          const r = await fetch(rc.origin + p);
          console.log(`[Warmup] ${region}${p} \u2192 ${r.status}`);
        } catch (e) {
          console.error(`[Warmup] ${region}${p} FAILED:`, e.message);
        }
      }
    }
    console.log("[Cron] Complete.");
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map