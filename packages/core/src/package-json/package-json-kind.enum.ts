/**
 * These are the kinds of packageJson files we distinguish. The on you interact
 * with during DEVELOPMENT is the source packageJson file, and will be
 * transformed prior to DISTRIBUTION.
 */
export enum PackageJsonKind {
	/**
	 * Used in the repository as the source packageJson
	 */
	DEVELOPMENT = 'development',
	/**
	 * The packageJson that will be in the distributed package
	 */
	DISTRIBUTION = 'distribution',
}
