import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { T } from "./theme";

export const Root: React.FC = () => (
  <>
    <Composition id="LaunchVertical" component={Film} width={1080} height={1920} fps={T.fps} durationInFrames={T.fps * T.duration} />
    <Composition id="LaunchLandscape" component={Film} width={1920} height={1080} fps={T.fps} durationInFrames={T.fps * T.duration} />
  </>
);
