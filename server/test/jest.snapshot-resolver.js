module.exports = {
    // resolves from test to snapshot path
    resolveSnapshotPath: (testPath, snapshotExtension) =>
        testPath.replace('_build/test', 'test/__snapshots__') +
        snapshotExtension,

    // resolves from snapshot to test path
    resolveTestPath: (snapshotFilePath, snapshotExtension) =>
        snapshotFilePath
            .replace('test/__snapshots__', '_build/test')
            .slice(0, -snapshotExtension.length),

    // Example test path, used for preflight consistency check of the implementation above
    testPathForConsistencyCheck: '_build/test/example.js',
}
