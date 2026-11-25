package com.opentoilet.dto.response;

import java.util.List;

public record ImageAnalysisResponse(String status, List<Detection> detectedObjects, List<String> hygieneSignals) {
    public record Detection(String label, double confidence, double[] box) { }
}
