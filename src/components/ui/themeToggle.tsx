import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons-react";

const ThemeToggle = () => {

 const { toggleColorScheme, colorScheme } = useMantineColorScheme();

  return (
    <>
   
      <ActionIcon
        variant="outline"
        color={colorScheme === "dark" ? "yellow" : "blue"}
        onClick={() => toggleColorScheme()}
        title="Toggle color scheme"
        size={"xl"}
         
      >
        {colorScheme === "dark" ? (
          <IconSun size=""  />
        ) : (
          <IconMoonStars size="" />
        )}
      </ActionIcon>
     
    </>
  );
};

export default ThemeToggle;
