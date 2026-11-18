import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** 하단 탭 */
export type TabParamList = {
  Map: undefined;
  List: undefined;
};

/** 화면 전체를 덮는 스택. 각 화면이 받는 값(params)을 여기서 정의한다. */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Detail: { toiletId: string };
  Report: { toiletId: string };
  ErrorReport: { toiletId: string };
};

export type RootStackProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

/** 탭 화면에서 상세 화면 등 스택 화면으로 이동할 수 있도록 두 타입을 합친 것 */
export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
