// resolves from test to snapshot path
export const resolveSnapshotPath = (
    testPath: string,
    snapshotExtension: string,
) => {
    return (
        testPath.replace('_build/test/case', 'test/__snapshots__') +
        snapshotExtension
    )
}

// resolves from snapshot to test path
export const resolveTestPath = (
    snapshotFilePath: string,
    snapshotExtension: string,
) => {
    return snapshotFilePath
        .replace('test/__snapshots__', '_build/test/case')
        .slice(0, -snapshotExtension.length)
}

// Example test path, used for preflight consistency check of the implementation above
export const testPathForConsistencyCheck = '_build/test/case/example.js'
