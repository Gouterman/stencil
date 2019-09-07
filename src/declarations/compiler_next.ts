import { Build } from './build-conditionals';
import { BuilderProgram, CustomTransformers } from 'typescript';
import { BuildOnEvents, CompilerEventFileAdd, CompilerEventFileDelete, CompilerEventFileUpdate } from './build-events';
import { Diagnostic } from './diagnostics';
import { HotModuleReplacement } from './build';
import { OutputOptions } from 'rollup';
import { OutputTargetBaseNext } from './output-targets';


export interface CompilerNext {
  build(): Promise<CompilerBuildResults>;
  createWatcher(): Promise<CompilerWatcher>;
  destroy(): Promise<void>;
  sys: CompilerSystem;
}

export interface CompilerSystem {
  /**
   * Always returns a boolean, does not throw.
   */
  access(p: string): Promise<boolean>;
  /**
   * Always returns a boolean, does not throw.
   */
  accessSync(p: string): boolean;
  /**
   * Always returns a boolean if the files were copied or not. Does not throw.
   */
  copyFile(src: string, dst: string): Promise<boolean>;
  exit(exitCode: number): void;
  getCurrentDirectory(): string;
  getExecutingFilePath(): string;
  /**
   * Always returns a boolean if the directory was created or not. Does not throw.
   */
  mkdir(p: string, opts?: CompilerSystemMakeDirectoryOptions): Promise<boolean>;
  /**
   * Always returns a boolean if the directory was created or not. Does not throw.
   */
  mkdirSync(p: string, opts?: CompilerSystemMakeDirectoryOptions): boolean;
  /**
   * All return paths are full normalized paths, not just the file names. Always returns an array, does not throw.
   */
  readdir(p: string): Promise<string[]>;
  /**
   * All return paths are full normalized paths, not just the file names. Always returns an array, does not throw.
   */
  readdirSync(p: string): string[];
  /**
   * Returns undefined if file is not found. Does not throw.
   */
  readFile(p: string, encoding?: string): Promise<string>;
  /**
   * Returns undefined if file is not found. Does not throw.
   */
  readFileSync(p: string, encoding?: string): string;
  /**
   * Returns undefined if there's an error. Does not throw.
   */
  realpath(p: string): Promise<string>;
  /**
   * Returns undefined if there's an error. Does not throw.
   */
  realpathSync(p: string): string;
  resolvePath(p: string): string;
  /**
   * Always returns a boolean if the directory was removed or not. Does not throw.
   */
  rmdir(p: string): Promise<boolean>;
  /**
   * Always returns a boolean if the directory was removed or not. Does not throw.
   */
  rmdirSync(p: string): boolean;
  /**
   * Returns undefined if stat not found. Does not throw.
   */
  stat(p: string): Promise<CompilerFsStats>;
  /**
   * Returns undefined if stat not found. Does not throw.
   */
  statSync(p: string): CompilerFsStats;
  /**
   * Always returns a boolean if the file was removed or not. Does not throw.
   */
  unlink(p: string): Promise<boolean>;
  /**
   * Always returns a boolean if the file was removed or not. Does not throw.
   */
  unlinkSync(p: string): boolean;

  watchDirectory(p: string, callback: CompilerFileWatcherCallback): CompilerFileWatcher;
  watchFile(p: string, callback: CompilerFileWatcherCallback): CompilerFileWatcher;
  /**
   * How many milliseconds to wait after a change before calling watch callbacks.
   */
  fileWatchTimeout: number;
  /**
   * Always returns a boolean if the file was written or not. Does not throw.
   */
  writeFile(p: string, content: string): Promise<boolean>;
  /**
   * Always returns a boolean if the file was written or not. Does not throw.
   */
  writeFileSync(p: string, content: string): boolean;
}

export type CompilerFileWatcherEvent = CompilerEventFileAdd | CompilerEventFileDelete | CompilerEventFileUpdate;

export type CompilerFileWatcherCallback = (fileName: string, eventKind: CompilerFileWatcherEvent) => void;

export interface CompilerFileWatcher {
  close(): void;
}

export interface CompilerSystemMakeDirectoryOptions {
  /**
   * Indicates whether parent folders should be created.
   * @default false
   */
  recursive?: boolean;
  /**
   * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
   * @default 0o777.
   */
  mode?: number;
}


export interface BundleOptions {
  conditionals: Build;
  id: string;
  customTransformers: CustomTransformers;
  inputs: {[entryKey: string]: string};
  outputOptions: OutputOptions;
  outputTargets: OutputTargetBaseNext[];
  tsBuilder: BuilderProgram;
}


export interface CompilerFsStats {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  size: number;
}


export interface CompilerWatcher extends BuildOnEvents {
  start(): Promise<WatcherCloseResults>;
  close(): Promise<WatcherCloseResults>;
}


export interface CompilerBuildStart {
  buildId: number;
  timestamp: string;
}

export interface CompilerBuildResults {
  buildId: number;
  diagnostics: Diagnostic[];
  dirsAdded: string[];
  dirsDeleted: string[];
  duration: number;
  filesAdded: string[];
  filesChanged: string[];
  filesUpdated: string[];
  filesDeleted: string[];
  hasError: boolean;
  hasSuccessfulBuild: boolean;
  hmr?: HotModuleReplacement;
  isRebuild: boolean;
  outputs: BuildOutput[];
  timestamp: string;
}

export interface BuildOutput {
  type: string;
  files: string[];
}

export interface BuildOutputFile {
  name: string;
  content: string;
}

export type OnCallback = (buildStart: CompilerBuildStart) => void;
export type RemoveCallback = () => boolean;

export interface WatcherCloseResults {
  exitCode: number;
}
