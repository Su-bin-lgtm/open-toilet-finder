package com.opentoilet.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class LocalImageStorage implements ImageStorage {
    private static final Pattern SAFE_KEY = Pattern.compile("[0-9a-f-]{36}\\.(jpg|png)");
    private final Path root;

    public LocalImageStorage(@Value("${app.images.storage-dir:${user.home}/.open-toilet-finder/images}") String directory) {
        root = Path.of(directory).toAbsolutePath().normalize();
    }

    @Override
    public String store(byte[] content, String extension) {
        String key = UUID.randomUUID() + extension;
        Path temporary = null;
        try {
            Files.createDirectories(root);
            temporary = Files.createTempFile(root, ".upload-", ".tmp");
            Files.write(temporary, content);
            try {
                Files.move(temporary, resolve(key), StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(temporary, resolve(key));
            }
            return key;
        } catch (IOException ex) {
            if (temporary != null) {
                try { Files.deleteIfExists(temporary); } catch (IOException ignored) { }
            }
            throw new ImageStorageException("이미지 파일을 저장하지 못했습니다.", ex);
        }
    }

    @Override
    public byte[] read(String storageKey) {
        try {
            return Files.readAllBytes(resolve(storageKey));
        } catch (IOException ex) {
            throw new ImageStorageException("이미지 파일을 읽지 못했습니다.", ex);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException ex) {
            throw new ImageStorageException("임시 이미지 파일을 정리하지 못했습니다.", ex);
        }
    }

    private Path resolve(String storageKey) {
        if (storageKey == null || !SAFE_KEY.matcher(storageKey).matches()) {
            throw new IllegalArgumentException("유효하지 않은 이미지 식별자입니다.");
        }
        Path resolved = root.resolve(storageKey).normalize();
        if (!resolved.startsWith(root)) throw new IllegalArgumentException("유효하지 않은 이미지 식별자입니다.");
        return resolved;
    }
}
