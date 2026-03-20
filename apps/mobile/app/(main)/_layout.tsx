import { Icon } from "@/components/Icon";
import { Layout } from "@/components/Layout";
import type { iconRegistry } from "@/constants/icons";
import {
	useAuthControllerHandle,
	useGetClientProfilePhotoControllerHandle,
	useGetHasUnreadNotificationsControllerHandle,
} from "@/gen/index";
import { authClient } from "@/services/auth";
import { Text } from "@sf-digital-ui/react-native";
import { colors } from "@sf-digital-ui/tokens";
import {
	type RelativePathString,
	Stack,
	usePathname,
	useRouter,
} from "expo-router";
import {
	BellIcon,
	Construction,
	CreditCardIcon,
	FileTextIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";

import { Pressable, StyleSheet, View, type ViewProps } from "react-native";

const MainHeader = (props: ViewProps) => {
	const router = useRouter();
	const { data, isFetching } = useGetHasUnreadNotificationsControllerHandle();
	const { t } = useTranslation("general");

	const user = authClient.useSession().data?.user;
	const { data: authData } = useAuthControllerHandle();
	const { data: profilePhotoData } = useGetClientProfilePhotoControllerHandle(
		authData?.id || "",
		{
			query: {
				enabled: !!authData?.id,
			},
		},
	);

	const profilePhotoUri = profilePhotoData?.profilePhoto
		? `data:image/jpeg;base64,${profilePhotoData.profilePhoto}`
		: undefined;

	const nameParts = authData?.name?.split(" ") || [];
	const initials =
		(nameParts[0]?.charAt(0) + (nameParts[1]?.charAt(0) || "")).toUpperCase() ||
		"?";

	return (
		<View
			style={[
				{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingTop: 16,
				},
				props.style,
			]}
		>
			<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
				<Pressable onPress={() => router.push("/(profile)")}>
					{profilePhotoUri ? (
						<Image
							source={{ uri: profilePhotoUri }}
							style={headerStyles.profileImage}
							testID="header-profile-photo"
						/>
					) : (
						<View style={headerStyles.avatarFallback} testID="header-avatar">
							<Text fontWeight="bold" style={{ color: colors.neutral["300"] }}>
								{initials}
							</Text>
						</View>
					)}
				</Pressable>
				<View>
					<Text
						size="sm"
						style={{
							color: colors.neutral["600"],
						}}
					>
						{t("welcome_back")}
					</Text>
					<Text
						fontWeight="bold"
						style={{
							color: colors.neutral["600"],
							maxWidth: 250,
						}}
						numberOfLines={1}
						ellipsizeMode="tail"
					>
						{user?.email ?? "User"}
					</Text>
				</View>
			</View>
			<Pressable
				onPress={() => router.push("/notifications")}
				style={{
					padding: 16,
					flexDirection: "row",
					alignItems: "flex-start",
				}}
			>
				<BellIcon
					style={{ paddingVertical: 16 }}
					color={colors.neutral["700"]}
					size={20}
				/>
				<View
					testID="unread-indicator"
					style={{
						width: 8,
						height: 8,
						borderRadius: 8,
						backgroundColor:
							!isFetching && data?.hasUnreadNotifications
								? colors.success["600"]
								: "transparent",
					}}
				/>
			</Pressable>
		</View>
	);
};

type FooterPage = {
	path: string;
	label: string;
	icon: string | null;
	lucideIcon: "credit-card" | "file-text" | "construction" | null;
};

const renderFooterIcon = (page: FooterPage, iconColor: string) => {
	if (page.icon) {
		return (
			<Icon.Icon
				name={page.icon as keyof typeof iconRegistry}
				size={24}
				strokeWidth={2}
				stroke={iconColor}
			/>
		);
	}
	if (page.lucideIcon === "credit-card") {
		return <CreditCardIcon size={24} strokeWidth={2} color={iconColor} />;
	}
	if (page.lucideIcon === "file-text") {
		return <FileTextIcon size={24} strokeWidth={2} color={iconColor} />;
	}
	if (page.lucideIcon === "construction") {
		return <Construction size={24} strokeWidth={2} stroke={iconColor} />;
	}
	return null;
};

const MainFooter = (props: ViewProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const { t } = useTranslation("main_footer");

	const isSelected = (path: string) => pathname === path;

	return (
		<View
			style={[
				{
					flexDirection: "row",
					justifyContent: "space-evenly",
					paddingVertical: 20,
					borderTopWidth: 1,
					borderColor: colors.neutral["30"],
				},
				props.style,
			]}
		>
			{pagesWithFooter.map((page) => {
				const iconColor = isSelected(page.path)
					? colors["primary-green"]["500"]
					: colors.neutral["500"];
				return (
					<View
						key={page.path}
						style={{ gap: 6, alignItems: "center" }}
						onTouchEnd={() =>
							router.push({
								pathname: page.path as RelativePathString,
								params: {},
							})
						}
					>
						{renderFooterIcon(page, iconColor)}
						<Text
							size="xs"
							style={{
								color: iconColor,
							}}
						>
							{t(page.label)}
						</Text>
						<View
							style={{
								height: 2,
								width: "100%",
								backgroundColor: isSelected(page.path)
									? colors["primary-green"]["500"]
									: "transparent",
							}}
						/>
					</View>
				);
			})}
		</View>
	);
};

const pagesWithHeader = ["/home", "/maintenance", "/payments", "/documents"];

const pagesWithFooter: FooterPage[] = [
	{ path: "/home", label: "home", icon: "home-line", lucideIcon: null },
	{
		path: "/maintenance",
		label: "maintenance",
		icon: null,
		lucideIcon: "construction",
	},
	{
		path: "/payments",
		label: "payments",
		icon: null,
		lucideIcon: "credit-card",
	},
	{
		path: "/documents",
		label: "documents",
		icon: null,
		lucideIcon: "file-text",
	},
];

const MainLayout = () => {
	const pathname = usePathname();

	return (
		<Layout.SafeAreaView
			style={{
				backgroundColor: pagesWithFooter.some((page) => page.path === pathname)
					? colors.neutral["10"]
					: "white",
				flex: 1,
				paddingHorizontal: 16,
			}}
		>
			{pagesWithHeader.includes(pathname) && <MainHeader />}
			<Stack screenOptions={{ headerShown: false, animation: "none" }} />
			{pagesWithFooter.some((page) => page.path === pathname) && (
				<MainFooter
					style={{
						backgroundColor: colors.neutral["10"],
					}}
				/>
			)}
		</Layout.SafeAreaView>
	);
};

export default MainLayout;

const headerStyles = StyleSheet.create({
	profileImage: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
	avatarFallback: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.neutral["30"],
		justifyContent: "center",
		alignItems: "center",
	},
});
