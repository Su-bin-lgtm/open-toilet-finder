package com.opentoilet.service;

import com.opentoilet.dto.response.ImageAnalysisResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ToiletImageAnalyzer {
    ImageAnalysisResponse analyze(Long toiletId, MultipartFile image);
}
