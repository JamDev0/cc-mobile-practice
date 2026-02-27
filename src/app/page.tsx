"use client";

import { useTheme } from "@/shared/theme/ThemeProvider";
import { InkHome } from "@/variants/ink";
import { TerraHome } from "@/variants/terra";
import { FrostHome } from "@/variants/frost";
import { NoirHome } from "@/variants/noir";
import { CitrusHome } from "@/variants/citrus";

export default function HomePage() {
  const { theme } = useTheme();

  switch (theme) {
    case "ink":
      return <InkHome />;
    case "terra":
      return <TerraHome />;
    case "frost":
      return <FrostHome />;
    case "noir":
      return <NoirHome />;
    case "citrus":
      return <CitrusHome />;
  }
}
