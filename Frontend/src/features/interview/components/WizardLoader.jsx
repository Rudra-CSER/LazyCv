import { useState, useEffect } from "react";
import "../style/wizard-loader.scss";
import AnimatedBackground from "./AnimatedBackground";

const WizardLoader = ({
  isDone = false,
  text = "Crafting your interview strategy",
  sub  = "Our AI wizard is analyzing your profile",
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isDone) return;
    // Organic fill: fast at start, asymptotically slows toward 90%
    const id = setInterval(() => {
      setProgress(p => {
        const inc = Math.max(0.05, (90 - p) * 0.015);
        return Math.min(90, p + inc);
      });
    }, 100);
    return () => clearInterval(id);
  }, [isDone]);

  // When isDone, override to 100 — no extra setState needed
  const barWidth = isDone ? 100 : progress;

  return (
    <div className="wl">
      <AnimatedBackground />

      <div className="wl__scene">
        {/* Objects flying around */}
        <div className="wl__objects">
          <div className="wl__square" />
          <div className="wl__circle" />
          <div className="wl__triangle" />
        </div>

        {/* Wizard character */}
        <div className="wl__wizard">
          <div className="wl__body" />

          <div className="wl__right-arm">
            <div className="wl__right-hand" />
          </div>

          <div className="wl__left-arm">
            <div className="wl__left-hand" />
          </div>

          <div className="wl__head">
            <div className="wl__beard" />
            <div className="wl__face">
              <div className="wl__adds" />
            </div>
            <div className="wl__hat">
              <div className="wl__hat-top" />
              <div className="wl__star wl__star--1" />
              <div className="wl__star wl__star--2" />
              <div className="wl__star wl__star--3" />
            </div>
          </div>
        </div>
      </div>

      <p className="wl__title">{text}</p>
      <p className="wl__sub">{sub}</p>

      <div className="wl__progress">
        <div
          className="wl__progress-fill"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="wl__noise" />
    </div>
  );
};

export default WizardLoader;
