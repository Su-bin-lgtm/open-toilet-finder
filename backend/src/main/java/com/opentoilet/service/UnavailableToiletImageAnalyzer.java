package com.opentoilet.service;

import com.opentoilet.dto.response.ImageAnalysisResponse;
import org.springframework.web.multipart.MultipartFile;

public class UnavailableToiletImageAnalyzer implements ToiletImageAnalyzer {
    @Override
    public ImageAnalysisResponse analyze(Long toiletId, MultipartFile image) {
        throw new ImageAnalysisUnavailableException();
    }
}
