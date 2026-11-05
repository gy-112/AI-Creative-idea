package com.example.seoulgo.location;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class MissionLocationService {
    private static final Map<Long, String> CENTER_KEYS = Map.of(
            101L, "SEOULGO_DONGNIMMUN_COORDS",
            102L, "SEOULGO_GWANGHWAMUN_COORDS",
            901L, "SEOULGO_GANGNAM_COORDS",
            902L, "SEOULGO_NAMSAN_COORDS"
    );

    private final boolean enabled;
    private final Environment environment;

    public MissionLocationService(@Value("${SEOULGO_GPS_ENABLED:true}") boolean enabled, Environment environment) {
        this.enabled = enabled;
        this.environment = environment;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Result check(long missionId, Double latitude, Double longitude) {
        if (!enabled) return Result.ALLOWED;
        if (!valid(latitude, longitude)) return Result.INVALID_LOCATION;
        String key = CENTER_KEYS.get(missionId);
        if (key == null) return Result.MISSION_LOCATION_NOT_CONFIGURED;
        String[] center = environment.getProperty(key, "").split(",", -1);
        if (center.length != 2) return Result.MISSION_LOCATION_NOT_CONFIGURED;

        try {
            double targetLat = Double.parseDouble(center[0].trim());
            double targetLon = Double.parseDouble(center[1].trim());
            if (!valid(targetLat, targetLon)) return Result.MISSION_LOCATION_NOT_CONFIGURED;
            return distanceMeters(latitude, longitude, targetLat, targetLon) <= 500
                    ? Result.ALLOWED : Result.OUTSIDE_RADIUS;
        } catch (NumberFormatException ex) {
            return Result.MISSION_LOCATION_NOT_CONFIGURED;
        }
    }

    private static boolean valid(Double lat, Double lon) {
        return lat != null && lon != null && Double.isFinite(lat) && Double.isFinite(lon)
                && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
    }

    private static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.pow(Math.sin(dLon / 2), 2);
        return 2 * 6_371_000 * Math.asin(Math.sqrt(Math.min(1.0, a)));
    }

    public enum Result {
        ALLOWED, INVALID_LOCATION, OUTSIDE_RADIUS, MISSION_LOCATION_NOT_CONFIGURED
    }
}
