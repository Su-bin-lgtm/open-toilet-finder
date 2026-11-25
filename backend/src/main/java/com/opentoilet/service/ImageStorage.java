package com.opentoilet.service;

public interface ImageStorage {
    String store(byte[] content, String extension);
    byte[] read(String storageKey);
    void delete(String storageKey);
}
