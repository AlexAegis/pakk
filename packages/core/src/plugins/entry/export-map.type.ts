import { AllExportPathCombinations } from '../../package-json/package-json-export-target.enum.js';

/**
 * An exportmaps key describes the name of the export and the value is the path
 * relative from the packageJson file.
 *
 * ExportMaps could contain paths that are correct only from the DEVELOPMENT
 * packageJson or that are meant for the DISTRIBUTION package.
 *
 * TODO: This is why there's an additional flag next to each path.
 * @example in a workspace like:
 * /project/package/foo/
 * 						- package.json
 * 						- src/api
 * 								- /index.ts
 * 								- /hello.ts
 * 								- /a/index.ts
 * 								- /b/hello.ts
 *
 * With the following autolib config:
 * ```json
 * {
 * 		"srcDir": "src",
 * 		"exportsBasePath": "api",
 * 		"exports": ["**\/*.ts"],
 * }
 * ```
 *
 * The following exports object will be created:
 *
 * ```json
 * {
 * 	"exportMap": {
 * 		".": {
 * 			"development-to-source": "./src/api/index.ts",
 * 			"development-to-dist": "./dist/api/index.js",
 * 			"distribution-to-source": "./src/api/index.ts",
 * 		},
 * 		"./hello": {
 * 			"development-to-source": "./src/api/hello.ts",
 * 			"development-to-dist": "./dist/api/hello.js",
 * 			"distribution-to-source": "./src/api/hello.ts",
 * 		},
 * 		"./a": {
 * 			"development-to-source": "./src/api/a/index.ts",
 * 			"development-to-dist": "./dist/api/a/index.js",
 * 			"distribution-to-source": "./src/api/a/index.ts",
 * 		},
 * 		"./b/hello": {
 * 			"development-to-source": "./src/api/b/hello.ts",
 * 			"development-to-dist": "./dist/api/b/hello.js",
 * 			"distribution-to-source": "./src/api/b/hello.ts",
 * 		}
 * 	}
 * }
 * ```
 * This exportMap will then be later used to create the packageJson exportMap
 *
 * As you might notice, because inferring /index to the name of it's parent,
 * two paths can result in the same name if there is a file and a folder with
 * the same name. If this happens, autolib will simply throw an error.
 *
 * TODO: throw an error on name collisions like hello.ts vs hello/index.ts
 */
export type ExportMap = Record<string, Record<AllExportPathCombinations, string>>;
