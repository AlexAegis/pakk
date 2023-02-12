import { LoggerOption, normalizeLoggerOption } from '@alexaegis/logging';

export interface AutoMetadataOptions extends LoggerOption {
	/**
	 * A list of packageJson keys to read to autofill in built artifacts
	 *
	 * Keys already present in the package's packageJson file will take
	 * precendence if they are objects or arrays, otherwise overwritten
	 *
	 * @defaultValue DEFAULT_AUTO_METADATA_KEYS_FROM_WORKSPACE - ["license", "author", "homepage", "bugs", "keywords", "config", "engines"]
	 */
	keysFromWorkspace?: string[];

	/**
	 * Keys that you must define yourself. This plugin can't figure them out
	 * for you, but it can add their keys as empty values into the source
	 * packageJson. When one is missing or empty, the build is aborted!
	 *
	 * @defaultValue DEFAULT_AUTO_METADATA_MANDATORY_KEYS - ["name", "displayName", "description", "version"]
	 */
	mandatoryKeys?: string[];

	/**
	 * A set of key value pairs that will only be used as packageJson values
	 * when not found in the workspace packageJson
	 *
	 * @defaultValue {}
	 */
	fallbackEntries?: Record<string, string>;

	/**
	 * A set of key value pairs that will always be used and overwrite
	 * everything else
	 *
	 * @defaultValue {}
	 */
	overrideEntries?: Record<string, string>;
}

export const DEFAULT_AUTO_METADATA_KEYS_FROM_WORKSPACE = [
	'license',
	'author',
	'homepage',
	'bugs',
	'keywords',
	'config',
	'engines',
];

export const DEFAULT_AUTO_METADATA_MANDATORY_KEYS = [
	'name',
	'displayName',
	'description',
	'version',
];

export type NormalizedAutoMetadataOptions = Required<AutoMetadataOptions>;

export const normalizeAutoMetadataOptions = (
	options?: AutoMetadataOptions
): NormalizedAutoMetadataOptions => {
	return {
		...normalizeLoggerOption(options),
		keysFromWorkspace: options?.keysFromWorkspace ?? DEFAULT_AUTO_METADATA_KEYS_FROM_WORKSPACE,
		mandatoryKeys: options?.mandatoryKeys ?? [],
		fallbackEntries: options?.fallbackEntries ?? {},
		overrideEntries: options?.overrideEntries ?? {},
	};
};
