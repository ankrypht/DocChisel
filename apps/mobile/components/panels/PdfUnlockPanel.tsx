import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Unlock, Eye, EyeOff } from 'lucide-react-native';

interface PdfUnlockPanelProps {
  password: string;
  onChangePassword: (pass: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfUnlockPanel: React.FC<PdfUnlockPanelProps> = ({
  password,
  onChangePassword,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Unlock size={14} color="#14B8A6" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted ml-1.5">
            Unlock Protected PDF
          </Text>
        </View>
        <View className="px-2.5 py-0.5 rounded-full bg-teal/10 border border-teal/25">
          <Text className="text-[10px] font-mono font-bold text-teal">
            Decrypt
          </Text>
        </View>
      </View>

      {/* Password Input */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-textSecondary mb-1.5">
          Document Password
        </Text>
        <View className="relative justify-center">
          <TextInput
            testID="unlock-password-input"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={onChangePassword}
            placeholder="Enter password used to lock this PDF"
            placeholderTextColor="#71717A"
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1"
          >
            {showPassword ? (
              <EyeOff size={16} color="#A1A1AA" />
            ) : (
              <Eye size={16} color="#A1A1AA" />
            )}
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-textMuted mt-1.5 leading-5">
          Unlocking creates a permanent, clean unencrypted copy of the document for editing and sharing.
        </Text>
      </View>

      {/* Output Filename */}
      <View>
        <Text className="text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename (Optional)
        </Text>
        <TextInput
          testID="unlock-output-filename"
          value={outputFilename}
          onChangeText={onChangeOutputFilename}
          placeholder="unlocked_document.pdf"
          placeholderTextColor="#71717A"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
        />
      </View>
    </View>
  );
};
