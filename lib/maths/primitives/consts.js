export const PrimitiveType = {
    Plane   : 1,
    Sphere  : 2,
    Cube    : 4,
    Capsule : 8,
};

export const CollisionType = {
    PlaneCapsule : PrimitiveType.Plane + PrimitiveType.Capsule,
};
