import { Monitor, Moon, Sun } from "lucide-react";
import React from "react";

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	apiKey: string | null;
	onApiKeyUpdate: (key: string) => void;
	theme: "light" | "dark" | "system";
	setTheme: (theme: "light" | "dark" | "system") => void;
	errorMessage?: string;
}

export default function SettingsModal({
	isOpen,
	onClose,
	apiKey,
	onApiKeyUpdate,
	theme,
	setTheme,
	errorMessage,
}: SettingsModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center">
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80">
				<h2 className="text-lg font-bold mb-4 text-black dark:text-white">
					Settings
				</h2>

				{errorMessage && (
					<div className="mb-4 text-red-500">{errorMessage}</div>
				)}

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1 text-black dark:text-white">
						API Key
					</label>
					<input
						type="password"
						value={apiKey || ""}
						onChange={(e) => onApiKeyUpdate(e.target.value)}
						className={`w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-black dark:text-white ${
							errorMessage ? "border-red-500" : ""
						}`}
					/>
				</div>

				{/* Theme Selection */}
				<div className="mb-4">
					<label className="block text-sm font-medium mb-1 text-black dark:text-white">
						Theme
					</label>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setTheme("light")}
							className={`p-2 rounded-md ${
								theme === "light"
									? "bg-blue-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
							}`}
						>
							<Sun size={20} />
						</button>
						<button
							onClick={() => setTheme("dark")}
							className={`p-2 rounded-md ${
								theme === "dark"
									? "bg-blue-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
							}`}
						>
							<Moon size={20} />
						</button>
						<button
							onClick={() => setTheme("system")}
							className={`p-2 rounded-md ${
								theme === "system"
									? "bg-blue-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
							}`}
						>
							<Monitor size={20} />
						</button>
					</div>
				</div>

				<button
					onClick={onClose}
					className="mt-4 w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	);
}
