"use client";
import "@aws-amplify/ui-react/styles.css";
import { ThemeProvider, Authenticator, translations, Theme } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";
import outputs from "../../amplify_outputs.json";

// Configure Amplify immediately
Amplify.configure(outputs, { ssr: true });

// Configure I18n for Japanese
I18n.putVocabularies(translations);
I18n.setLanguage("ja");

// Custom theme for better visibility
const theme: Theme = {
  name: "custom-theme",
  tokens: {
    components: {
      authenticator: {
        router: {
          borderWidth: "0",
          backgroundColor: { value: "#f9fafb" },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: "#2563eb" },
          _hover: {
            backgroundColor: { value: "#1d4ed8" },
          },
          _active: {
            backgroundColor: { value: "#1e40af" },
          },
          _focus: {
            backgroundColor: { value: "#1d4ed8" },
          },
        },
      },
      tabs: {
        item: {
          _active: {
            color: { value: "#2563eb" },
            borderColor: { value: "#2563eb" },
          },
        },
      },
    },
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <Authenticator.Provider>{children}</Authenticator.Provider>
    </ThemeProvider>
  );
}
