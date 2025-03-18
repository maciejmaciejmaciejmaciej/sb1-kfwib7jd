import { Link, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Text style={styles.title}>This screen doesn't exist.</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to home screen!</Text>
      </Link>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: '40%',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    alignSelf: 'center',
  },
  linkText: {
    color: '#0073E6',
    fontSize: 16,
  },
});