import axios from 'axios';
//import createLogger from '../../utilities/logger';

//const logger = createLogger('players', 'jsonl');

function getImageValue(id: string): number {
  let sum = 0;
  for (const char of id) {
    sum += char.charCodeAt(0);
  }
  return sum % 10;
}

// Define interface for user data returned from the service
interface RawUserData {
  user_id: string;
  operatorId: string;
  balance: number;
  [key: string]: any;
}

interface FinalUserData extends RawUserData {
  userId: string;
  id: string;
  game_id: string;
  token: string;
  image: number;
}

export const getUserDataFromSource = async (
  token: string,
  game_id: string
): Promise<FinalUserData | false | undefined> => {
  try {
    const response = await axios.get(`${process.env.service_base_url}/service/user/detail`, {
      headers: {
        token: token,
      },
    });

    const userData: RawUserData | undefined = response?.data?.user;

    if (userData) {
      const userId = encodeURIComponent(userData.user_id);
      const { operatorId } = userData;
      const id = `${operatorId}:${userId}`;
      const image = getImageValue(id);

      const finalData: FinalUserData = {
        ...userData,
        userId,
        id,
        game_id,
        token,
        image,
      };

      return finalData;
    }

    return;
  } catch (err: any) {
    console.error(err);
    //logger.error(JSON.stringify({ data: token, err }));
    return false;
  }
};
