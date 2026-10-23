import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';

interface PdfProtectPanelProps {
  userPassword: string;
  onChangeUserPassword: (pass: string) => void;
  outputFilename: string;
  onChangeOutputFilename: (val: string) => void;
}

export const PdfProtectPanel: React.FC<PdfProtectPanelProps> = ({
  userPassword,
  onChangeUserPassword,
  outputFilename,
  onChangeOutputFilename,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const isMatching = userPassword.length > 0 && userPassword === confirmPassword;

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Lock size={14} color="#F59E0B" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-textMuted ml-1.5">
            Password Protection (AES-256)
          </Text>
        </View>
        <View className="flex-row items-center px-2 py-0.5 rounded-full bg-amber/10 border border-amber/25">
          <ShieldCheck size={10} color="#F59E0B" />
          <Text className="text-[10px] font-mono font-bold text-amber ml-1">
            High Security
          </Text>
        </View>
      </View>

      {/* Password Fields */}
      <View className="space-y-3 mb-4">
        <View className="mb-2">
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Enter Password
          </Text>
          <View className="relative justify-center">
            <TextInput
              testID="protect-password-input"
              secureTextEntry={!showPassword}
              value={userPassword}
              onChangeText={onChangeUserPassword}
              placeholder="Minimum 6 characters recommended"
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
        </View>

        <View>
          <Text className="text-xs font-semibold text-textSecondary mb-1.5">
            Confirm Password
          </Text>
          <TextInput
            testID="protect-confirm-password-input"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password to confirm"
            placeholderTextColor="#71717A"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border text-sm text-textPrimary ${
              confirmPassword.length > 0
                ? isMatching
                  ? 'border-emerald'
                  : 'border-danger'
                : 'border-border'
            }`}
          />
        </View>
      </View>

      {confirmPassword.length > 0 && !isMatching && (
        <Text className="text-xs text-danger font-medium mb-3">
          Passwords do not match. Please verify both fields.
        </Text>
      )}

      {/* Output Filename */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-textSecondary mb-1.5">
          Output PDF Filename (Optional)
        </Text>
        <TextInput
          testID="protect-output-filename"
          value={outputFilename}
          onChangeText={onChangeOutputFilename}
          placeholder="protected_document.pdf"
          placeholderTextColor="#71717A"
          className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceElevated border border-border text-sm text-textPrimary"
        />
      </View>

      {/* Privacy Notice */}
      <View className="p-3 rounded-xl bg-surfaceElevated border border-border">
        <Text className="text-xs text-textMuted leading-5">
          <Text className="font-bold text-textSecondary">Zero Cloud Privacy: </Text>
          Your document is encrypted locally with AES-256. DocChisel never transmits, stores, or recovers passwords.
        </Text>
      </View>
    </View>
  );
};
