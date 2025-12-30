
### Swing Rotation by doing Axis Angle with Signed Radian
https://github.com/godotengine/godot/blob/5cb1ec590036fba44cdd8e727136ec6c25f11660/scene/3d/skeleton_modifier_3d.cpp#L290C1-L305C2
Quaternion SkeletonModifier3D::get_from_to_rotation_by_axis(const Vector3 &p_from, const Vector3 &p_to, const Vector3 &p_axis) {
	const double ALMOST_ONE = 1.0 - CMP_EPSILON;
	double dot = p_from.dot(p_to);
	if (dot > ALMOST_ONE) {
		return Quaternion();
	}
	if (dot < -ALMOST_ONE) {
		return Quaternion(p_axis, Math::PI);
	}
	double angle = p_from.angle_to(p_to);
	Vector3 cross = p_from.cross(p_to);
	if (std::signbit(cross.dot(p_axis))) {
		angle = -angle;
	}
	return Quaternion(p_axis, angle);
}

### Get roll angle from a quaternion
https://github.com/godotengine/godot/blob/5cb1ec590036fba44cdd8e727136ec6c25f11660/scene/3d/skeleton_modifier_3d.cpp#L346
double SkeletonModifier3D::get_roll_angle(const Quaternion &p_rotation, const Vector3 &p_roll_axis) {
	// Ensure roll axis is normalized.
	Vector3 roll_axis = p_roll_axis.normalized();

	// Project the quaternion rotation onto the roll axis.
	// This gives us the component of rotation around that axis.
	double dot = p_rotation.x * roll_axis.x +
			p_rotation.y * roll_axis.y +
			p_rotation.z * roll_axis.z;

	// Create a quaternion representing just the roll component.
	Quaternion roll_component;
	roll_component.x = roll_axis.x * dot;
	roll_component.y = roll_axis.y * dot;
	roll_component.z = roll_axis.z * dot;
	roll_component.w = p_rotation.w;

	// Normalize this component.
	double length = roll_component.length();
	if (length > CMP_EPSILON) {
		roll_component = roll_component / length;
	} else {
		return 0.0;
	}

	// Extract the angle.
	double angle = 2.0 * Math::acos(CLAMP(roll_component.w, -1.0, 1.0));

	// Determine the sign.
	double direction = (roll_component.x * roll_axis.x + roll_component.y * roll_axis.y + roll_component.z * roll_axis.z > 0) ? 1.0 : -1.0;

	return symmetrize_angle(angle * direction);
}