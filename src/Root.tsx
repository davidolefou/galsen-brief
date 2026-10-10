import React from "react";
import { Composition } from "remotion";
import { Week, WeekProps, weekSlideCount } from "./Week";
import week from "../weekly/2026-10-09.json";
import { Edition, EditionProps, totalFrames } from "./Edition";
import sample from "../public/editions/2026-10-09-matin/props.json";

export const Root: React.FC = () => (
  <>
  <Composition
    id="GalsenBrief"
    component={Edition}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={totalFrames(sample as EditionProps)}
    defaultProps={sample as EditionProps}
    calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(props) })}
  />
  <Composition
    id="SemaineEnBref"
    component={Week}
    width={1080}
    height={1350}
    fps={30}
    durationInFrames={weekSlideCount(week as WeekProps)}
    defaultProps={week as WeekProps}
    calculateMetadata={({ props }) => ({ durationInFrames: weekSlideCount(props) })}
  />
  </>
);
