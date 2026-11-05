package com.example.seoulgo.mission.service;

import com.example.seoulgo.ai.vision.PhotoVisionService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class PhotoMissionService {
    private static final Map<Long, PhotoMission> MISSIONS = Map.of(
            901L, new PhotoMission(
                    "Gangnam Style horse-riding pose",
                    "Both elbows are bent and the wrists or forearms cross "
                            + "in front of the torso as if holding reins."
            ),
            902L, new PhotoMission(
                    "Namsan K-pop reference pose",
                    "One arm extends diagonally above shoulder height and "
                            + "the other points down. Either left-right orientation is accepted."
            )
    );

    private final PhotoVisionService vision;

    public PhotoMissionService(PhotoVisionService vision) {
        this.vision = vision;
    }

    public boolean supports(long missionId) {
        return MISSIONS.containsKey(missionId);
    }

    public PhotoVisionService.Result verify(long missionId, MultipartFile photo, String language) {
        PhotoMission mission = MISSIONS.get(missionId);
        return vision.verify(photo, mission.name(), mission.pose(), language);
    }

    private record PhotoMission(String name, String pose) {}
}
