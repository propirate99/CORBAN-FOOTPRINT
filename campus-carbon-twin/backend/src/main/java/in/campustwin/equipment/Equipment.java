package in.campustwin.equipment;

public record Equipment(
    String id,
    String roomId,
    String name,
    String type,
    double activeWattage,
    double standbyWattage,
    boolean isActive
) {}
