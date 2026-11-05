package com.example.seoulgo.landmark;

import java.util.List;

public class LandmarkDtos {

    public record NearbyItem(Long landmarkId,
                             String name,
                             String regionName,
                             double latitude,
                             double longitude,
                             int distanceM,
                             String iconUrl,
                             boolean badgeOwned) {}

    public record NearbyRes(double centerLat, double centerLng, List<NearbyItem> landmarks) {}
}

