
import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";

const WavyBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const wavy = {
      y: h * 0.5,
      waveWidth: w * 1.5,
      speed: 1,
      waveOpacity: 0.5,
      waveLength: 20,
      blur: 10,
      stroke: 2,
    };

    const noise3D = createNoise3D();
    let animationId: number;
    let nt = 0;

    const getThemeColors = () => {
      const root = document.documentElement;
      const primary = `hsl(${getComputedStyle(root).getPropertyValue(
        "--primary"
      )})`;
      const secondary = `hsl(${getComputedStyle(root).getPropertyValue(
        "--secondary"
      )})`;
      const accent = `hsl(${getComputedStyle(root).getPropertyValue(
        "--accent"
      )})`;
      return [primary, secondary, accent];
    };

    let colors = getThemeColors();

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.filter = `blur(${wavy.blur}px)`;
      for (let i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = wavy.stroke;
        ctx.globalAlpha = wavy.waveOpacity;
        ctx.beginPath();
        ctx.moveTo(0, wavy.y);
        for (let x = 0; x < wavy.waveWidth; x += 10) {
          const y =
            noise3D(x / 500, nt + i, nt + i * 2) * wavy.waveLength + wavy.y;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.closePath();
      nt += 0.005 * wavy.speed;

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          colors = getThemeColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} id="canvas"></canvas>;
};

export default WavyBackground;
