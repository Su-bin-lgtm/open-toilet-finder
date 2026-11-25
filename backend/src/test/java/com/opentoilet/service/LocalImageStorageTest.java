package com.opentoilet.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalImageStorageTest {
    @TempDir
    Path directory;

    @Test
    void storedFileSurvivesStorageAdapterRecreation() throws Exception {
        byte[] content = {1, 2, 3, 4};
        LocalImageStorage first = new LocalImageStorage(directory.toString());

        String key = first.store(content, ".png");
        LocalImageStorage afterRestart = new LocalImageStorage(directory.toString());

        assertArrayEquals(content, afterRestart.read(key));
        assertTrue(Files.exists(directory.resolve(key)));
        afterRestart.delete(key);
        assertFalse(Files.exists(directory.resolve(key)));
    }

    @Test
    void rejectsPathTraversalStorageKey() {
        LocalImageStorage storage = new LocalImageStorage(directory.toString());
        assertThrows(IllegalArgumentException.class, () -> storage.read("../outside.png"));
    }
}
