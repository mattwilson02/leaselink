import { memo } from "react";
import { Text } from "@/design-system/components/Typography";
import { colors } from "@/design-system/theme";
import { View, Pressable } from "react-native";
import { Folder, FolderClosed } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

type Props = {
	folderName: string;
	fileCount: number;
	size: number;
	mostRecentUpdatedDate: string;
};

const FolderItem = ({
	folderName,
	fileCount,
	size,
	mostRecentUpdatedDate,
}: Props) => {
	const router = useRouter();
	const { t } = useTranslation("documents");
	const { t: tDetails } = useTranslation("document_details");

	const handlePress = () => {
		router.push(
			`/document-folder/${encodeURIComponent(folderName)}?mostRecentUpdatedDate=${mostRecentUpdatedDate}&fileCount=${fileCount}`,
		);
	};

	return (
		<Pressable onPress={handlePress} testID="folder-item-container">
			<View
				style={{
					borderColor: colors.border,
					borderWidth: 1,
					borderRadius: 8,
					padding: 16,
					backgroundColor: colors.card,
					gap: 10,
				}}
			>
				<View
					style={{
						backgroundColor: colors.secondary,
						borderRadius: 12,
						padding: 12,
						alignSelf: 'flex-start',
					}}
				>
					<FolderClosed size={24} color={colors.mutedForeground} />
				</View>
				<Text
					style={{
						color: colors.neutral["500"],
						fontWeight: "bold",
					}}
				>
					{tDetails(`${folderName}`)}
				</Text>
				<Text
					style={{
						color: colors.neutral["500"],
					}}
				>
					{fileCount} {fileCount !== 1 ? t("files") : t("file")} -{" "}
					{size < 1024
						? `${size.toFixed(1)} KB`
						: `${(size / 1024).toFixed(1)} MB`}
				</Text>
			</View>
		</Pressable>
	);
};

export default memo(FolderItem);
