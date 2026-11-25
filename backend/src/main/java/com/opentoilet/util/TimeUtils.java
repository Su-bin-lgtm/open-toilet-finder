package com.opentoilet.util;

import java.time.LocalTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// 개방 시간 문자열(예: "09:00 ~ 18:00")을 분석하여 현재 시간 기준 개방 여부를 판별하는 유틸리티
public class TimeUtils {

    private static final Pattern TIME_RANGE_PATTERN = Pattern.compile("(\\d{1,2}):(\\d{2})\\s*[~-]\\s*(\\d{1,2}):(\\d{2})");

    private TimeUtils() {}

    // 화장실의 24시간 여부와 개방 시간 문구를 기반으로 현재 개방 중인지 여부 반환
    public static boolean isOpenNow(Boolean isOpen24h, String openTimeInfo) {
        if (Boolean.TRUE.equals(isOpen24h)) {
            return true;
        }
        if (openTimeInfo == null || openTimeInfo.isBlank()) {
            return false;
        }

        String info = openTimeInfo.trim();
        if (info.contains("24시간") || info.contains("상시") || info.contains("연중무휴")) {
            return true;
        }

        Matcher matcher = TIME_RANGE_PATTERN.matcher(info);
        if (matcher.find()) {
            try {
                int startHour = Integer.parseInt(matcher.group(1));
                int startMinute = Integer.parseInt(matcher.group(2));
                int endHour = Integer.parseInt(matcher.group(3));
                int endMinute = Integer.parseInt(matcher.group(4));

                LocalTime now = LocalTime.now();
                LocalTime start = LocalTime.of(startHour, startMinute);
                LocalTime end = (endHour == 24 && endMinute == 0) ? LocalTime.of(23, 59, 59) : LocalTime.of(endHour, endMinute);

                // 야간 영업 (예: 20:00 ~ 04:00)
                if (start.isAfter(end)) {
                    return !now.isBefore(start) || !now.isAfter(end);
                }
                return !now.isBefore(start) && !now.isAfter(end);
            } catch (Exception e) {
                return false;
            }
        }

        return false;
    }
}
