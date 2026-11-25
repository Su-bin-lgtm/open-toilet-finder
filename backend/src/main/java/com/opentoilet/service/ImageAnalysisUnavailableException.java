package com.opentoilet.service;

public class ImageAnalysisUnavailableException extends RuntimeException {
    public ImageAnalysisUnavailableException() {
        super("YOLOv8 모델 가중치 및 분석 어댑터가 아직 연결되지 않았습니다.");
    }
}
