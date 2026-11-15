import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CacheStorageService,
  ICacheStorageService,
  ILocalStorageService,
  LocalStorageOptions,
  LocalStorageService,
  StorageError,
  StorageErrorCode,
} from '@sebasmf/uceva-storage-manager';

type Tab = 'local' | 'cache';
type ValueType = 'text' | 'number' | 'boolean' | 'json';
type LogLevel = 'ok' | 'info' | 'error';
type LogSource = 'LocalStorage' | 'CacheStorage';

interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  code?: StorageErrorCode;
}

interface LocalRow {
  key: string;
  value: string;
}

interface CacheView {
  name: string;
  entries: string[];
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Se tipan contra las interfaces públicas para demostrar el contrato de la API.
  private readonly local: ILocalStorageService = inject(LocalStorageService);
  private readonly cache: ICacheStorageService = inject(CacheStorageService);

  protected readonly tab = signal<Tab>('local');
  protected readonly logs = signal<LogEntry[]>([]);
  private logSeq = 0;

  // ---------- LocalStorage ----------
  protected lsKey = 'usuario';
  protected lsValue = '{"nombre":"Ada","visitas":1}';
  protected lsType: ValueType = 'json';
  protected lsPrefix = 'demo';
  protected lsDefault = 'valor por defecto';
  protected lsViewPrefix = '';

  protected readonly lsRows = signal<LocalRow[]>([]);
  protected readonly lsSize = signal(0);
  protected readonly lsResult = signal('—');

  // ---------- Cache Storage ----------
  protected readonly cacheSupported = typeof caches !== 'undefined';
  protected readonly secureContext = typeof isSecureContext !== 'undefined' && isSecureContext;
  protected csName = 'demo-cache';
  protected csUrl = '/api/usuarios/1';
  protected csJson = '{"id":1,"nombre":"Ada Lovelace"}';
  protected csRaw = 'Texto plano guardado con put()';

  protected readonly caches = signal<CacheView[]>([]);
  protected readonly csResult = signal('—');

  protected readonly cacheBlocked = computed(() => !this.cacheSupported || !this.secureContext);

  constructor() {
    this.refreshLocal();
    void this.refreshCaches();
    window.addEventListener('storage', () => this.refreshLocal());
  }

  // ===== Utilidades =====
  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'local') this.refreshLocal();
    else void this.refreshCaches();
  }

  protected clearLogs(): void {
    this.logs.set([]);
  }

  private log(source: LogSource, level: LogLevel, message: string, code?: StorageErrorCode): void {
    const entry: LogEntry = {
      id: ++this.logSeq,
      time: new Date().toLocaleTimeString('es-CO'),
      level,
      source,
      message,
      code,
    };
    this.logs.update((list) => [entry, ...list].slice(0, 80));
  }

  /** Ejecuta una operación y captura `StorageError` mostrando su `code`. */
  private run<T>(source: LogSource, label: string, fn: () => T): T | undefined {
    try {
      return fn();
    } catch (e) {
      this.handleError(source, label, e);
      return undefined;
    }
  }

  private async runAsync<T>(
    source: LogSource,
    label: string,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (e) {
      this.handleError(source, label, e);
      return undefined;
    }
  }

  private handleError(source: LogSource, label: string, e: unknown): void {
    if (e instanceof StorageError) {
      this.log(source, 'error', `${label} → ${e.message}`, e.code);
    } else {
      this.log(source, 'error', `${label} → ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private show(value: unknown): string {
    if (value === undefined) return 'undefined';
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  // ===== LocalStorage =====
  private get lsOptions(): LocalStorageOptions | undefined {
    const prefix = this.lsPrefix.trim();
    return prefix ? { prefix } : undefined;
  }

  private parseInput(): unknown {
    switch (this.lsType) {
      case 'number': {
        const n = Number(this.lsValue);
        if (this.lsValue.trim() === '' || Number.isNaN(n)) {
          throw new Error('El valor no es un número válido.');
        }
        return n;
      }
      case 'boolean':
        return this.lsValue.trim().toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(this.lsValue);
        } catch {
          throw new Error('El valor no es un JSON válido.');
        }
      default:
        return this.lsValue;
    }
  }

  protected refreshLocal(): void {
    const result = this.run('LocalStorage', 'keys()', () => {
      const prefix = this.lsViewPrefix.trim() || undefined;
      const options: LocalStorageOptions | undefined = prefix ? { prefix } : undefined;
      const rows = this.local.keys(prefix).map((key) => ({
        key: prefix ? `${prefix}:${key}` : key,
        value: this.show(this.local.get<unknown>(key, options)),
      }));
      return { rows, size: this.local.size(prefix) };
    });
    if (result) {
      this.lsRows.set(result.rows);
      this.lsSize.set(result.size);
    }
  }

  protected lsSet(): void {
    this.run('LocalStorage', 'set()', () => {
      this.local.set(this.lsKey, this.parseInput(), this.lsOptions);
      const withPrefix = this.lsOptions ? ` con prefijo "${this.lsPrefix.trim()}"` : '';
      this.log('LocalStorage', 'ok', `set("${this.lsKey}") guardado${withPrefix}.`);
    });
    this.refreshLocal();
  }

  protected lsGet(): void {
    this.run('LocalStorage', 'get()', () => {
      const value = this.local.get<unknown>(this.lsKey, this.lsOptions);
      this.lsResult.set(this.show(value));
      this.log(
        'LocalStorage',
        'info',
        `get("${this.lsKey}") → ${value === null ? 'null (no existe)' : 'valor leído'}.`,
      );
    });
  }

  protected lsGetOrDefault(): void {
    this.run('LocalStorage', 'getOrDefault()', () => {
      const value = this.local.getOrDefault<unknown>(this.lsKey, this.lsDefault, this.lsOptions);
      this.lsResult.set(this.show(value));
      this.log('LocalStorage', 'info', `getOrDefault("${this.lsKey}") → ${this.show(value)}`);
    });
  }

  protected lsHas(): void {
    this.run('LocalStorage', 'has()', () => {
      const exists = this.local.has(this.lsKey, this.lsOptions);
      this.lsResult.set(String(exists));
      this.log('LocalStorage', 'info', `has("${this.lsKey}") → ${exists}`);
    });
  }

  protected lsUpdate(): void {
    this.run('LocalStorage', 'update()', () => {
      const updated = this.local.update<unknown>(
        this.lsKey,
        (current) => {
          if (typeof current === 'string') return `${current} (editado)`;
          if (typeof current === 'number') return current + 1;
          if (typeof current === 'boolean') return !current;
          if (Array.isArray(current)) return [...current, 'nuevo'];
          return { ...(current as object), actualizado: new Date().toISOString() };
        },
        this.lsOptions,
      );
      this.lsResult.set(this.show(updated));
      this.log('LocalStorage', 'ok', `update("${this.lsKey}") aplicado.`);
    });
    this.refreshLocal();
  }

  /** Con `raw = true` se elimina la clave tal cual (ya incluye su prefijo). */
  protected lsRemove(key: string = this.lsKey, raw = false): void {
    this.run('LocalStorage', 'remove()', () => {
      const removed = this.local.remove(key, raw ? undefined : this.lsOptions);
      this.log(
        'LocalStorage',
        removed ? 'ok' : 'info',
        `remove("${key}") → ${removed ? 'eliminada' : 'no existía'}.`,
      );
    });
    this.refreshLocal();
  }

  protected lsClear(onlyPrefix: boolean): void {
    this.run('LocalStorage', 'clear()', () => {
      const prefix = onlyPrefix ? this.lsPrefix.trim() || undefined : undefined;
      this.local.clear(prefix);
      this.log(
        'LocalStorage',
        'ok',
        prefix ? `clear("${prefix}") ejecutado.` : 'clear() ejecutado: LocalStorage limpio.',
      );
    });
    this.refreshLocal();
  }

  protected lsProvokeError(): void {
    this.run('LocalStorage', 'set("")', () => this.local.set('', 'x'));
    this.run('LocalStorage', 'set(circular)', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      this.local.set('circular', circular);
    });
  }

  // ===== Cache Storage =====
  private cacheGuard(): boolean {
    if (!this.cacheSupported) {
      this.log(
        'CacheStorage',
        'error',
        'Cache Storage no está disponible. Requiere HTTPS o localhost.',
        'STORAGE_UNAVAILABLE',
      );
      return false;
    }
    return true;
  }

  protected async refreshCaches(): Promise<void> {
    if (!this.cacheSupported) return;
    const views = await this.runAsync('CacheStorage', 'listCaches()', async () => {
      const names = await this.cache.listCaches();
      return Promise.all(
        names.map(async (name) => ({ name, entries: await this.cache.listEntries(name) })),
      );
    });
    if (views) this.caches.set(views);
  }

  protected async csOpen(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'openCache()', async () => {
      await this.cache.openCache(this.csName);
      this.log('CacheStorage', 'ok', `openCache("${this.csName}") → caché lista.`);
    });
    await this.refreshCaches();
  }

  protected async csHas(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'hasCache()', async () => {
      const exists = await this.cache.hasCache(this.csName);
      this.csResult.set(String(exists));
      this.log('CacheStorage', 'info', `hasCache("${this.csName}") → ${exists}`);
    });
  }

  protected async csList(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'listCaches()', async () => {
      const names = await this.cache.listCaches();
      this.csResult.set(this.show(names));
      this.log('CacheStorage', 'info', `listCaches() → ${names.length} caché(s).`);
    });
    await this.refreshCaches();
  }

  protected async csPutJson(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'putJson()', async () => {
      let data: unknown;
      try {
        data = JSON.parse(this.csJson);
      } catch {
        throw new Error('El cuerpo no es un JSON válido.');
      }
      await this.cache.putJson(this.csName, this.csUrl, data);
      this.log('CacheStorage', 'ok', `putJson("${this.csName}", "${this.csUrl}") guardado.`);
    });
    await this.refreshCaches();
  }

  protected async csPut(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'put()', async () => {
      const response = new Response(this.csRaw, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
      await this.cache.put(this.csName, this.csUrl, response);
      this.log('CacheStorage', 'ok', `put("${this.csName}", "${this.csUrl}") guardado como Response.`);
    });
    await this.refreshCaches();
  }

  protected async csMatch(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'match()', async () => {
      const response = await this.cache.match(this.csName, this.csUrl);
      if (!response) {
        this.csResult.set('undefined');
        this.log('CacheStorage', 'info', `match("${this.csUrl}") → sin coincidencia.`);
        return;
      }
      const text = await response.text();
      const type = response.headers.get('Content-Type') ?? '';
      this.csResult.set(`HTTP ${response.status} · ${type}\n${text}`);
      this.log('CacheStorage', 'info', `match("${this.csUrl}") → Response ${response.status}.`);
    });
  }

  protected async csMatchJson(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'matchJson()', async () => {
      const data = await this.cache.matchJson<unknown>(this.csName, this.csUrl);
      this.csResult.set(this.show(data));
      this.log(
        'CacheStorage',
        'info',
        `matchJson("${this.csUrl}") → ${data === null ? 'null' : 'JSON leído'}.`,
      );
    });
  }

  protected async csListEntries(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'listEntries()', async () => {
      const entries = await this.cache.listEntries(this.csName);
      this.csResult.set(this.show(entries));
      this.log('CacheStorage', 'info', `listEntries("${this.csName}") → ${entries.length} entrada(s).`);
    });
    await this.refreshCaches();
  }

  protected async csDeleteEntry(url: string = this.csUrl, cacheName: string = this.csName): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'deleteEntry()', async () => {
      const deleted = await this.cache.deleteEntry(cacheName, url);
      this.log(
        'CacheStorage',
        deleted ? 'ok' : 'info',
        `deleteEntry("${url}") → ${deleted ? 'eliminada' : 'no existía'}.`,
      );
    });
    await this.refreshCaches();
  }

  protected async csDeleteCache(name: string = this.csName): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'deleteCache()', async () => {
      const deleted = await this.cache.deleteCache(name);
      this.log(
        'CacheStorage',
        deleted ? 'ok' : 'info',
        `deleteCache("${name}") → ${deleted ? 'eliminada' : 'no existía'}.`,
      );
    });
    await this.refreshCaches();
  }

  protected async csClearAll(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'clearAllCaches()', async () => {
      const count = await this.cache.clearAllCaches();
      this.log('CacheStorage', 'ok', `clearAllCaches() → ${count} caché(s) eliminada(s).`);
    });
    await this.refreshCaches();
  }

  protected async csProvokeError(): Promise<void> {
    if (!this.cacheGuard()) return;
    await this.runAsync('CacheStorage', 'openCache("   ")', () => this.cache.openCache('   '));
    await this.runAsync('CacheStorage', 'putJson("")', () =>
      this.cache.putJson(this.csName, '', { x: 1 }),
    );
  }
}
