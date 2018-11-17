import * as d from '../../declarations';
import { catchError } from '../util';
import { PluginCtx, PluginTransformResults } from '../../declarations/plugin';
import { parseCssImports } from '../style/css-imports';


export async function runPluginResolveId(pluginCtx: PluginCtx, importee: string) {
  for (const plugin of pluginCtx.config.plugins) {

    if (typeof plugin.resolveId === 'function') {
      try {
        const results = plugin.resolveId(importee, null, pluginCtx);

        if (results != null) {
          if (typeof (results as any).then === 'function') {
            const promiseResults = await results;
            if (promiseResults != null) {
              return promiseResults as string;
            }

          } else if (typeof results === 'string') {
            return results as string;
          }
        }

      } catch (e) {
        catchError(pluginCtx.diagnostics, e);
      }
    }
  }

  // default resolvedId
  return importee;
}


export async function runPluginLoad(pluginCtx: PluginCtx, id: string) {
  for (const plugin of pluginCtx.config.plugins) {

    if (typeof plugin.load === 'function') {
      try {
        const results = plugin.load(id, pluginCtx);

        if (results != null) {
          if (typeof (results as any).then === 'function') {
            const promiseResults = await results;
            if (promiseResults != null) {
              return promiseResults as string;
            }

          } else if (typeof results === 'string') {
            return results as string;
          }
        }

      } catch (e) {
        catchError(pluginCtx.diagnostics, e);
      }
    }
  }

  // default load()
  return pluginCtx.fs.readFile(id);
}


export async function runPluginTransforms(config: d.Config, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx, id: string, moduleFile?: d.ModuleFile) {
  const pluginCtx: PluginCtx = {
    config: config,
    sys: config.sys,
    fs: compilerCtx.fs,
    cache: compilerCtx.cache,
    diagnostics: []
  };

  const resolvedId = await runPluginResolveId(pluginCtx, id);
  const sourceText = await runPluginLoad(pluginCtx, resolvedId);

  const transformResults: PluginTransformResults = {
    code: sourceText,
    id: id
  };

  const isRawCssFile = transformResults.id.toLowerCase().endsWith('.css');

  if (isRawCssFile) {
    // concat all css @imports into one file
    // when the entry file is a .css file (not .scss)
    // do this BEFORE transformations on css files
    const shouldParseCssDocs = (!!moduleFile && config.outputTargets.some(o => {
      return o.type === 'docs' || o.type === 'docs-json' || o.type === 'docs-api';
    }));

    if (shouldParseCssDocs && moduleFile.cmpMeta) {
      moduleFile.cmpMeta.styleDocs = moduleFile.cmpMeta.styleDocs || [];
      transformResults.code = await parseCssImports(config, compilerCtx, buildCtx, id, id, transformResults.code, moduleFile.cmpMeta.styleDocs);

    } else {
      transformResults.code = await parseCssImports(config, compilerCtx, buildCtx, id, id, transformResults.code);
    }
  }

  for (const plugin of pluginCtx.config.plugins) {

    if (typeof plugin.transform === 'function') {
      try {
        let pluginTransformResults: PluginTransformResults;
        const results = plugin.transform(transformResults.code, transformResults.id, pluginCtx);

        if (results != null) {
          if (typeof (results as any).then === 'function') {
            pluginTransformResults = await results;

          } else {
            pluginTransformResults = results as PluginTransformResults;
          }

          if (pluginTransformResults != null) {
            if (typeof pluginTransformResults === 'string') {
              transformResults.code = pluginTransformResults as string;

            } else {
              if (typeof pluginTransformResults.code === 'string') {
                transformResults.code = pluginTransformResults.code;
              }
              if (typeof pluginTransformResults.id === 'string') {
                transformResults.id = pluginTransformResults.id;
              }
            }
          }
        }

      } catch (e) {
        catchError(buildCtx.diagnostics, e);
      }
    }
  }

  buildCtx.diagnostics.push(...pluginCtx.diagnostics);

  if (!isRawCssFile) {
    // sass precompiler just ran and converted @import "my.css" into @import url("my.css")
    // because of the ".css" extension. Sass did NOT concat the ".css" files into the output
    // but only updated it to use url() instead. Let's go ahead and concat the url() css
    // files into one file like we did for raw .css files.
    // do this AFTER transformations on non-css files
    const shouldParseCssDocs = (!!moduleFile && config.outputTargets.some(o => {
      return o.type === 'docs' || o.type === 'docs-json' || o.type === 'docs-api';
    }));

    if (shouldParseCssDocs && moduleFile.cmpMeta) {
      moduleFile.cmpMeta.styleDocs = moduleFile.cmpMeta.styleDocs || [];
      transformResults.code = await parseCssImports(config, compilerCtx, buildCtx, id, transformResults.id, transformResults.code, moduleFile.cmpMeta.styleDocs);

    } else {
      transformResults.code = await parseCssImports(config, compilerCtx, buildCtx, id, transformResults.id, transformResults.code);
    }
  }

  return transformResults;
}
