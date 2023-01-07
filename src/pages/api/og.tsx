import { ImageResponse } from '@vercel/og';
import { NextApiRequest } from 'next';

export const config = {
  runtime: 'edge',
};

export default function handler(req: NextApiRequest) {
  if (!req.url) {
    new Response(`Failed to generate the image`, {
      status: 500,
    });
  } else {
    try {
      const { searchParams } = new URL(req.url);
      const title = searchParams.get('title');
      const date = searchParams.get('date');
      const icon = new URL('/public/ito.jpg', import.meta.url).toString();
      return new ImageResponse(
        (
          <div
            style={{
              background: 'linear-gradient(to right, #66cdaa 0%, #66cdda 100%)',
              height: '100%',
              width: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '90%',
                width: '95%',
                display: 'flex',
                flexDirection: 'column',
                fontSize: '60px',
                background: 'white',
                position: 'absolute',
                top: '30px',
                left: '30px',
              }}
            >
              <div
                style={{
                  height: '50%',
                  textAlign: 'center',
                  fontSize: '100px',
                  alignSelf: 'center',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyItems: 'stretch',
                  height: '50%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '50%',
                    alignSelf: 'end',
                    margin: '10px',
                  }}
                >
                  <img
                    src={icon}
                    alt='icon'
                    width={100}
                    height={100}
                    style={{ borderRadius: '50%', borderColor: '#E2E8F0' }}
                  />
                  <div>dz99</div>
                </div>
                <div
                  style={{
                    width: '50%',
                    alignSelf: 'end',
                    textAlign: 'end',
                    margin: '10px',
                  }}
                >
                  {date}
                </div>
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 600,
        },
      );
    } catch {
      return new Response(`Failed to generate the image`, {
        status: 500,
      });
    }
  }
}
