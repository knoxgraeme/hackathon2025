// components/LoadingStates.tsx
'use client';

export function LoadingPipeline() {
    return (
      <div className="fixed inset-0 bg-[#e1f2ec]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        {/* Centered loading text and loader */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-80 max-w-[90vw]">
          {/* Square Loader */}
          <div className="square-loader mb-8">
            <span className="loader">
              <span className="loader-inner"></span>
            </span>
          </div>

          <p className="text-[#343434] text-[25px] leading-[32px]">
            PixieDirector is creating<br />your storyboard...
          </p>
        </div>

        <style jsx>{`
          .square-loader {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .loader {
            display: inline-block;
            width: 30px;
            height: 30px;
            position: relative;
            border: 4px solid #00a887;
            animation: loader 2s infinite ease;
          }

          .loader-inner {
            vertical-align: top;
            display: inline-block;
            width: 100%;
            background-color: #00a887;
            animation: loader-inner 2s infinite ease-in;
          }

          @keyframes loader {
            0% {
              transform: rotate(0deg);
            }

            25% {
              transform: rotate(180deg);
            }

            50% {
              transform: rotate(180deg);
            }

            75% {
              transform: rotate(360deg);
            }

            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes loader-inner {
            0% {
              height: 0%;
            }

            25% {
              height: 0%;
            }

            50% {
              height: 100%;
            }

            75% {
              height: 100%;
            }

            100% {
              height: 0%;
            }
          }
        `}</style>
      </div>
    );
  }